import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Liquidacion } from '../entities/liquidacion.entity';
import { GastoCombustible } from 'src/gasto-combustible/entities/gasto-combustible.entity';
import { GastoCaseta } from 'src/gasto-casetas/entities/gasto-caseta.entity';
import { GastoVario } from 'src/gasto-varios/entities/gasto-vario.entity';
import { CostoFlete } from 'src/costo-fletes/entities/costo-flete.entity';
import { User } from 'src/users/entities/user.entity';
import { ResultadoRendimiento } from '../enums/resultado-rendimiento.enum';
import { obtenerPorcentajeComisionDefault } from '../utils/porcentaje-comision.util';

@Injectable()
export class LiquidacionCalculosService {
    constructor(
        @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
        @InjectRepository(GastoCombustible) private readonly gastoCombustibleRepository: Repository<GastoCombustible>,
        @InjectRepository(GastoCaseta) private readonly gastoCasetaRepository: Repository<GastoCaseta>,
        @InjectRepository(GastoVario) private readonly gastosVariosRepository: Repository<GastoVario>,
        @InjectRepository(CostoFlete) private readonly costosFletesRepository: Repository<CostoFlete>,
    ) {}

    async recalcularTotales(liquidacionId: number, user?: User, manager?: EntityManager) {
        // ═══════════════════════════════════════════════════
        // CONFIGURACIÓN DE REPOSITORIOS
        // ═══════════════════════════════════════════════════
        const repoLiquidacion = manager ? manager.getRepository(Liquidacion) : this.liquidacionesRepository;
        const repoCombustible = manager ? manager.getRepository(GastoCombustible) : this.gastoCombustibleRepository;
        const repoCasetas = manager ? manager.getRepository(GastoCaseta) : this.gastoCasetaRepository;
        const repoVarios = manager ? manager.getRepository(GastoVario) : this.gastosVariosRepository;
        const repoFletes = manager ? manager.getRepository(CostoFlete) : this.costosFletesRepository;

        // ═══════════════════════════════════════════════════
        // CARGAR LIQUIDACIÓN CON RELACIONES
        // ═══════════════════════════════════════════════════
        const liquidacion = await repoLiquidacion.findOne({
            where: { id: liquidacionId },
            relations: ['unidad', 'operador'],
        });

        if (!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        // ═══════════════════════════════════════════════════
        // 1. SUMATORIAS DE GASTOS E INGRESOS (Paralelo)
        // ═══════════════════════════════════════════════════
        const [ combustibleRes, casetasRes, variosRes, fletesRes, anticiposRes, deducComRes, ] = await Promise.all([
            // Combustible (monto y litros)
            repoCombustible
                .createQueryBuilder('g')
                .select('COALESCE(SUM(g.monto), 0)', 'totalMonto')
                .addSelect('COALESCE(SUM(g.litros), 0)', 'totalLitros')
                .where('g.liquidacionId = :id', { id: liquidacionId })
                .getRawOne(),
            
            // Casetas
            repoCasetas
                .createQueryBuilder('g')
                .select('COALESCE(SUM(g.monto), 0)', 'total')
                .where('g.liquidacionId = :id', { id: liquidacionId })
                .getRawOne(),

            // Gastos varios
            repoVarios
                .createQueryBuilder('g')
                .select('COALESCE(SUM(g.monto), 0)', 'total')
                .where('g.liquidacionId = :id', { id: liquidacionId })
                .getRawOne(),

            // Fletes (ingresos)
            repoFletes
                .createQueryBuilder('c')
                .select('COALESCE(SUM(c.monto), 0)', 'total')
                .where('c.liquidacionId = :id', { id: liquidacionId })
                .getRawOne(),

            // Anticipos
            repoLiquidacion
                .createQueryBuilder('liq')
                .leftJoin('liq.anticipos', 'ant')
                .select('COALESCE(SUM(ant.monto), 0)', 'total')
                .where('liq.id = :id', { id: liquidacionId })
                .getRawOne(),

            // Deducciones comerciales
            repoLiquidacion
                .createQueryBuilder('liq')
                .leftJoin('liq.deducciones', 'ded')
                .select('COALESCE(SUM(ded.monto), 0)', 'total')
                .where('liq.id = :id', { id: liquidacionId })
                .getRawOne(),
        ]);

        const total_diesel_monto = Number(combustibleRes?.totalMonto) || 0;
        const total_diesel_litros = Number(combustibleRes?.totalLitros) || 0;
        const total_flete = Number(fletesRes?.total) || 0;
        const total_casetas = Number(casetasRes?.total) || 0;
        const total_gastos_varios = Number(variosRes?.total) || 0;
        const suma_anticipos = Number(anticiposRes?.total) || 0;
        const deduc_comerciales = Number(deducComRes?.total) || 0;

        // ═══════════════════════════════════════════════════
        // 2. CÁLCULO DE RENDIMIENTO DE DIESEL
        // ═══════════════════════════════════════════════════
        const kms = Number(liquidacion.kilometros_recorridos) || 0;
        const rend_tab = Number(liquidacion.rendimiento_tabulado) || 1;

        // Rendimiento real (km/litro)
        const rendimiento_real = total_diesel_litros > 0 
            ? Number((kms / total_diesel_litros).toFixed(2)) 
            : 0;

        // Precio promedio por litro
        const precio_promedio_litro = total_diesel_litros > 0 
            ? (total_diesel_monto / total_diesel_litros) 
            : 0;

        // Litros tabulados
        const litros_tabulados = rend_tab > 0 ? (kms / rend_tab) : 0;

        // Diferencia en litros
        const diferencia_litros = total_diesel_litros - litros_tabulados;

        // Diferencia en pesos
        const diferencia_pesos_con_iva = diferencia_litros * precio_promedio_litro;
        const diferencia_sin_iva = diferencia_pesos_con_iva / 1.16;

        // Determinar resultado (con tolerancia de 0.1 litros)
        let da_sin_iva = 0; // Diesel a favor (bono)
        let de_sin_iva = 0; // Diesel en contra (solo KPI)
        let resultado_rendimiento = ResultadoRendimiento.NEUTRO;

        const TOLERANCIA = 0.1;

        if (diferencia_litros > TOLERANCIA) {
            // Gastó MÁS diesel → EN CONTRA (solo informativo)
            de_sin_iva = Math.abs(diferencia_sin_iva);
            resultado_rendimiento = ResultadoRendimiento.CONTRA;
        } else if (diferencia_litros < -TOLERANCIA) {
            // Gastó MENOS diesel → A FAVOR (bono que suma al pago)
            da_sin_iva = Math.abs(diferencia_sin_iva);
            resultado_rendimiento = ResultadoRendimiento.FAVOR;
        }

        // ═══════════════════════════════════════════════════
        // 3. BASE PARA COMISIÓN (CON FERRY)
        // ═══════════════════════════════════════════════════
        const gasto_ferry = Number(liquidacion.gasto_ferry || 0);
        const base_comision = total_flete - total_diesel_monto - gasto_ferry;

        // ═══════════════════════════════════════════════════
        // 4. COMISIÓN DEL OPERADOR
        // ═══════════════════════════════════════════════════
        let pct_final = Number(liquidacion.comision_porcentaje) || 0;

        // Fallback: auto-detectar si no hay porcentaje asignado
        if (pct_final === 0) {
            pct_final = obtenerPorcentajeComisionDefault(liquidacion.unidad?.tipo_unidad);
        }

        // Comisión estimada (lo que el sistema calcula)
        const comision_estimada = (base_comision > 0 && pct_final > 0) 
            ? (base_comision * (pct_final / 100)) 
            : 0;

        // Comisión pagada (usa comision_pagada si existe, sino la estimada)
        const comision_pagada = liquidacion.comision_pagada !== null 
            ? Number(liquidacion.comision_pagada) 
            : comision_estimada;

        // Ajuste manual (cargos por golpes, préstamos, etc.)
        const ajuste_manual = Number(liquidacion.ajuste_manual || 0);

        // ═══════════════════════════════════════════════════
        // 5. TOTAL BRUTO (DESPUÉS de ajuste manual)
        // ═══════════════════════════════════════════════════
        // Comisión + Bono diesel a favor - Ajuste manual
        const total_bruto = comision_pagada + da_sin_iva - ajuste_manual;

        // ═══════════════════════════════════════════════════
        // 6. TOTAL NETO A PAGAR (lo que se lleva el operador)
        // ═══════════════════════════════════════════════════
        let total_neto_pagar: number;

        if (liquidacion.total_modificado_manualmente) {
            // ✅ El director ya dictó el total final manualmente
            // NO recalcular nada, usar el valor que guardó
            total_neto_pagar = Number(liquidacion.total_neto_pagar);
        } else {
            // ✅ Cálculo automático del sistema
            // Total bruto (ya incluye el ajuste) - Anticipos
            total_neto_pagar = total_bruto - suma_anticipos;
        }

        // ═══════════════════════════════════════════════════
        // 7. UTILIDAD DE LA EMPRESA (CON FERRY)
        // ═══════════════════════════════════════════════════
        // Flete - Diesel - Ferry - Casetas - Varios - Deducciones - Lo que REALMENTE se pagó
        const utilidad_viaje = total_flete 
            - total_diesel_monto 
            - gasto_ferry        // 🆕 Restamos el ferry
            - total_casetas 
            - total_gastos_varios 
            - deduc_comerciales
            - total_neto_pagar;
        // ═══════════════════════════════════════════════════
        // 8. PREPARAR DATOS PARA ACTUALIZAR
        // ═══════════════════════════════════════════════════
        const updateData = {
            // Totales de gastos e ingresos
            total_combustible: Number(total_diesel_monto.toFixed(2)),
            total_casetas: Number(total_casetas.toFixed(2)),
            total_gastos_varios: Number(total_gastos_varios.toFixed(2)),
            total_costo_fletes: Number(total_flete.toFixed(2)),
            total_deducciones_comerciales: Number(deduc_comerciales.toFixed(2)),
            
            // Comisión
            comision_porcentaje: Number(pct_final.toFixed(2)),
            comision_estimada: Number(comision_estimada.toFixed(2)),
            
            // Rendimiento de diesel
            rendimiento_real: rendimiento_real,
            diesel_a_favor_sin_iva: Number(da_sin_iva.toFixed(2)),
            diesel_en_contra_sin_iva: Number(de_sin_iva.toFixed(2)),
            resultado_rendimiento: resultado_rendimiento,
            
            // Totales finales
            total_bruto: Number(total_bruto.toFixed(2)),
            total_neto_pagar: Number(total_neto_pagar.toFixed(2)),
            utilidad_viaje: Number(utilidad_viaje.toFixed(2)),
            
            // Usuario editor (si se proporciona)
            ...(user ? { usuario_editor: user } : {}),
        };

        // ═══════════════════════════════════════════════════
        // 9. GUARDAR CAMBIOS
        // ═══════════════════════════════════════════════════
        if (manager) {
            await manager.update(Liquidacion, liquidacionId, updateData);
        } else {
            await this.liquidacionesRepository.update(liquidacionId, updateData);
        }

        // ═══════════════════════════════════════════════════
        // 10. RETORNAR LIQUIDACIÓN ACTUALIZADA
        // ═══════════════════════════════════════════════════
        return repoLiquidacion.findOne({
            where: { id: liquidacionId },
            relations: ['unidad', 'operador', 'usuario_creador', 'usuario_modificador_total'],
        });
    }
}