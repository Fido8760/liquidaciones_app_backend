import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Liquidacion } from "../entities/liquidacion.entity";
import { LiquidacionValidacionesService } from "./liquidacion-validaciones.service";
import { LiquidacionCalculosService } from "./liquidacion-calculos.service";
import { CambiarEstadoDto } from "../dto/cambiar-estado.dto";
import { User } from "src/users/entities/user.entity";
import { EstadoLiquidacion } from "../enums/estado-liquidacion.enum";
import { UserRole } from "src/users/enums/roles-usuarios.enum";
import { AjustarLiquidacionDto } from "../dto/ajustar-liquidacion.dto";
import { ModificarTotalDto } from "../dto/moficar-total.dto";

@Injectable()
export class LiquidacionWorkflowService {
    constructor(
        @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
        private readonly validacionesService: LiquidacionValidacionesService,
        private readonly calculoService: LiquidacionCalculosService
    ) {}

    async cambiarEstado(liquidacionId: number, cambiarEstadoDto: CambiarEstadoDto, user: User) {
        const liquidacion = await this.liquidacionesRepository.findOne({
            where: { id: liquidacionId },
            relations: ['usuario_creador']
        });

        if(!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        const estadoActual = liquidacion.estado;
        const nuevoEstado = cambiarEstadoDto.estado;

        this.validacionesService.validarEstadoFinal(liquidacion, user);
        this.validacionesService.validarCambioEstado(estadoActual, nuevoEstado, user);

        liquidacion.estado = nuevoEstado;
        liquidacion.usuario_editor = user;

        // A) FIRMA DE APROBACIÓN
        if (nuevoEstado === EstadoLiquidacion.APROBADA && user.rol === UserRole.CAPTURISTA) {
            liquidacion.usuario_aprobador = user;
        }

        // B) PAGO
        if (nuevoEstado === EstadoLiquidacion.PAGADA) {
            liquidacion.usuario_pagador = user;
            liquidacion.fecha_pago = new Date();
        }

        // C) RECHAZO O CORRECCIÓN
        if (estadoActual === EstadoLiquidacion.APROBADA && nuevoEstado === EstadoLiquidacion.EN_REVISION) {
            liquidacion.usuario_aprobador = null;
        }

        // D) CORRECCIÓN DE PAGO
        if (estadoActual === EstadoLiquidacion.PAGADA && nuevoEstado !== EstadoLiquidacion.PAGADA) {
            liquidacion.usuario_pagador = null;
            liquidacion.fecha_pago = null;
        }

        // ---------------------------------------------------------
        // 4. GUARDADO FINAL
        // ---------------------------------------------------------
        await this.liquidacionesRepository.save(liquidacion);

        return {
            message: `Estado actualizado correctamente a ${nuevoEstado}`,
            liquidacion,
        };
    }

    async ajustarLiquidacion(liquidacionId: number, ajustarLiquidacionDto: AjustarLiquidacionDto, user: User) {
        const liquidacion = await this.liquidacionesRepository.findOne({
            where: { id: liquidacionId },
        });

        if(!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        this.validacionesService.validarAjuste(liquidacion, user);

        liquidacion.rendimiento_tabulado = ajustarLiquidacionDto.rendimiento_tabulado;
        liquidacion.comision_porcentaje = ajustarLiquidacionDto.comision_porcentaje;
        liquidacion.ajuste_manual = ajustarLiquidacionDto.ajuste_manual || 0;
        liquidacion.motivo_ajuste = ajustarLiquidacionDto.motivo_ajuste || null;
        liquidacion.usuario_editor = user;

        await this.liquidacionesRepository.save(liquidacion);

        const liquidacionActualizada = await this.calculoService.recalcularTotales(liquidacionId, user);

        return {
            message: 'Liquidación ajustada correctamente',
            liquidacion: liquidacionActualizada
        }
    }

    async modificarTotalPago(liquidacionId: number, modificarTotalDto: ModificarTotalDto, user: User) {
        const liquidacion = await this.liquidacionesRepository.findOne({
            where: { id: liquidacionId },
            relations: ['anticipos']
        })

        if(!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        this.validacionesService.validarModificacionTotal(liquidacion, user);

        if(!liquidacion.total_modificado_manualmente) {
            liquidacion.total_neto_sugerido = liquidacion.total_neto_pagar;
        }

        const totalAnterior = liquidacion.total_neto_pagar;

        liquidacion.total_neto_pagar = modificarTotalDto.total_neto_pagar;
        liquidacion.total_modificado_manualmente = true;
        liquidacion.usuario_modificador_total = user;
        liquidacion.fecha_modificacion_total = new Date();
        liquidacion.usuario_editor = user;

        const utilidadViaje = liquidacion.total_costo_fletes - liquidacion.total_combustible - liquidacion.total_casetas - liquidacion.total_gastos_varios - liquidacion.total_deducciones_comerciales - modificarTotalDto.total_neto_pagar;

        liquidacion.utilidad_viaje = Number(utilidadViaje.toFixed(2));

        await this.liquidacionesRepository.save(liquidacion);

        const liquidacionActualizada = await this.liquidacionesRepository.findOne({
            where: { id: liquidacionId },
            relations: ['unidad', 'operador', 'usuario_modificador_total'],
        });

        return {
            message: 'Total a pagar modificado correctamente',
            liquidacion: liquidacionActualizada,
        }
    }

    async pasarARevisionSiBorrador(liquidacionId: number, user?: User) {
        const liquidacion = await this.liquidacionesRepository.findOneBy({
            id: liquidacionId,
        });

        if (!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        let huboCambios = false;

        if (liquidacion.estado === EstadoLiquidacion.BORRADOR) {
            liquidacion.estado = EstadoLiquidacion.EN_REVISION;
            huboCambios = true;
        }

        if (user) {
            liquidacion.usuario_editor = user;
            huboCambios = true;
        }

        if (huboCambios) {
            await this.liquidacionesRepository.save(liquidacion);
        }
    }

    async pasarARevisionSiBorradorConManager( manager: EntityManager, liquidacionId: number, user?: User ) {
        const liquidacion = await manager.findOne(Liquidacion, {
            where: { id: liquidacionId },
        });

        if (!liquidacion) {
            throw new NotFoundException('La liquidación no existe');
        }

        if (liquidacion.estado === EstadoLiquidacion.BORRADOR) {
            liquidacion.estado = EstadoLiquidacion.EN_REVISION;
            if (user) {
                liquidacion.usuario_editor = user;
            }
            await manager.save(Liquidacion, liquidacion);
        }
    }
}