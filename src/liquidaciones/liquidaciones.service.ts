import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindManyOptions, Repository } from 'typeorm';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { Liquidacion } from './entities/liquidacion.entity';
import { Unidad } from '../database/entities/unidad.entity';
import { Operador } from '../database/entities/operador.entity';
import { GastoCaseta } from '../gasto-casetas/entities/gasto-caseta.entity';
import { GastoCombustible } from 'src/gasto-combustible/entities/gasto-combustible.entity';
import { GastoVario } from 'src/gasto-varios/entities/gasto-vario.entity';
import { CostoFlete } from 'src/costo-fletes/entities/costo-flete.entity';
import { Anticipo } from 'src/anticipos/entities/anticipo.entity';
import { EstadoLiquidacion } from './enums/estado-liquidacion.enum';
import { User } from 'src/users/entities/user.entity';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { AjustarLiquidacionDto } from './dto/ajustar-liquidacion.dto';
import { ResultadoRendimiento } from './enums/resultado-rendimiento.enum';

type TransitionMap = Partial<Record<UserRole, Partial<Record<EstadoLiquidacion, EstadoLiquidacion[]>>>>;

const MAPA_TRANSICIONES: TransitionMap = {
  [UserRole.CAPTURISTA]: {
    [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.EN_REVISION],
    [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.APROBADA],
  },
  [UserRole.DIRECTOR]: {
    [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.CANCELADA],
    [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.CANCELADA, EstadoLiquidacion.APROBADA],
    [EstadoLiquidacion.APROBADA]: [EstadoLiquidacion.EN_REVISION, EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA],
  },
  [UserRole.ADMIN]: {
    [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.CANCELADA],
    [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.CANCELADA, EstadoLiquidacion.APROBADA],
    [EstadoLiquidacion.APROBADA]: [EstadoLiquidacion.EN_REVISION, EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA],
  },
};

@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
    @InjectRepository(Unidad) private readonly unidadesRepository: Repository<Unidad>,
    @InjectRepository(Operador) private readonly operadoresRepository: Repository<Operador>,
    @InjectRepository(GastoCaseta) private readonly gastoCasetaRepository: Repository<GastoCaseta>,
    @InjectRepository(GastoCombustible) private readonly gastoCombustibleRepository: Repository<GastoCombustible>,
    @InjectRepository(GastoVario) private readonly gastosVariosRepository: Repository<GastoVario>,
    @InjectRepository(CostoFlete) private readonly costosFeletesRepository: Repository<CostoFlete>,
    @InjectRepository(Anticipo) private readonly anticiposRepository: Repository<Anticipo>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async create(createLiquidacioneDto: CreateLiquidacioneDto, user: User) {
    const unidad = await this.unidadesRepository.findOneBy({
      id: createLiquidacioneDto.unidadId,
    });

    if (!unidad) {
      throw new NotFoundException(['La unidad no existe']);
    }

    const operador = await this.operadoresRepository.findOneBy({
      id: createLiquidacioneDto.operadorId,
    });

    if (!operador) {
      throw new NotFoundException(['El operador no existe']);
    }

    // 🎯 ASIGNAR PORCENTAJE POR DEFECTO SEGÚN TIPO DE UNIDAD
    const tipoUnidad = unidad.tipo_unidad?.toUpperCase() || '';
    let comision_porcentaje_inicial = 0;

    if (tipoUnidad.includes('TRACTOCAMION') || tipoUnidad.includes('TRAILER')) {
      comision_porcentaje_inicial = 18;
    } else if (tipoUnidad.includes('MUDANCERO') || tipoUnidad.includes('MUDANZA')) {
      comision_porcentaje_inicial = 20;
    } else if (tipoUnidad.includes('CAMIONETA')) {
      comision_porcentaje_inicial = 0; // 🎯 Sin comisión (salario fijo)
    }

    return this.liquidacionesRepository.save({
      ...createLiquidacioneDto,
      unidad,
      operador,
      usuario_creador: user,
      
      // 🎯 ASIGNAR PORCENTAJE INICIAL
      comision_porcentaje: comision_porcentaje_inicial,
      
      // Inicializar campos calculados
      comision_estimada: 0,
      comision_pagada: null,
      diesel_a_favor_sin_iva: 0,
      diesel_en_contra_sin_iva: 0,
      ajuste_manual: 0,
      total_combustible: 0,
      total_casetas: 0,
      total_gastos_varios: 0,
      total_costo_fletes: 0,
      total_deducciones_comerciales: 0,
      total_bruto: 0,
      total_neto_pagar: 0,
      utilidad_viaje: 0,
    });
  }

  async findAll(unidadId: number | null, take: number, skip: number) {
    const options: FindManyOptions<Liquidacion> = {
      relations: {
        unidad: true,
        operador: true,
        usuario_creador: true,
        usuario_editor: true,
      },
      select: {
        usuario_creador: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        usuario_editor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
      },
      order: {
        id: 'DESC',
      },
      take,
      skip,
    };

    if (unidadId) {
      options.where = {
        unidad: {
          id: unidadId,
        },
      };
    }

    const [liquidaciones, total] = await this.liquidacionesRepository.findAndCount(options);

    return {
      liquidaciones,
      total,
    };
  }

  async findOne(id: number) {
    const liquidacion = await this.liquidacionesRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
      relations: {
        unidad: true,
        operador: true,
        gastos_caseta: true,
        gastos_combustible: true,
        gastos_varios: true,
        costos_fletes: true,
        deducciones: true,
        anticipos: true,
        usuario_creador: true,
        usuario_editor: true,
        usuario_aprobador: true,
        usuario_pagador: true,
        notas: {
          usuario: true,
        },
      },
      select: {
        usuario_creador: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        usuario_editor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        usuario_aprobador: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true
        },
        usuario_pagador: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true
        },
        notas: {
          id: true,
          contenido: true,
          createdAt: true,
          usuario: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        
      },
      order: {
        notas: {
          createdAt: 'DESC',
        },
      },
    });

    if (!liquidacion) {
      throw new NotFoundException('La liquidación no existe');
    }
    return liquidacion;
  }

  async update( id: number, updateLiquidacionDto: UpdateLiquidacioneDto, user: User ) {
    const liquidacion = await this.findOne(id);

    validarBloqueoEdicion(liquidacion, user)

    Object.assign(liquidacion, updateLiquidacionDto);

    if (updateLiquidacionDto.unidadId) {
      const unidad = await this.unidadesRepository.findOneBy({
        id: updateLiquidacionDto.unidadId,
      });
      if (!unidad) {
        let errors: string[] = [];
        errors.push('La unidad no existe');
        throw new NotFoundException(errors);
      }

      liquidacion.unidad = unidad;
    }

    if (updateLiquidacionDto.operadorId) {
      const operador = await this.operadoresRepository.findOneBy({
        id: updateLiquidacionDto.operadorId,
      });
      if (!operador) {
        let errors: string[] = [];
        errors.push('El operador no existe');
        throw new NotFoundException(errors);
      }

      liquidacion.operador = operador;
    }
    liquidacion.usuario_editor = user;

    await this.liquidacionesRepository.save(liquidacion);
    return await this.recalcularTotales(liquidacion.id, user)
  }

  async remove(id: number, user: User) {
    const liquidacion = await this.findOne(id);

    validarBloqueoEdicion(liquidacion, user);

    liquidacion.usuario_editor = user;
    await this.liquidacionesRepository.update(id, { usuario_editor: user });
    await this.liquidacionesRepository.softRemove(liquidacion);
    return { message: 'Liquidación eliminada correctamente' };
  }

  async recalcularTotales(liquidacionId: number, user?: User, manager?: EntityManager) {
    // ═══════════════════════════════════════════════════
    // CONFIGURACIÓN DE REPOSITORIOS
    // ═══════════════════════════════════════════════════
    const repoLiquidacion = manager ? manager.getRepository(Liquidacion) : this.liquidacionesRepository;
    const repoCombustible = manager ? manager.getRepository(GastoCombustible) : this.gastoCombustibleRepository;
    const repoCasetas = manager ? manager.getRepository(GastoCaseta) : this.gastoCasetaRepository;
    const repoVarios = manager ? manager.getRepository(GastoVario) : this.gastosVariosRepository;
    const repoFletes = manager ? manager.getRepository(CostoFlete) : this.costosFeletesRepository;

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
    const rendimiento_real = total_diesel_litros > 0 ? Number((kms / total_diesel_litros).toFixed(2)) : 0;

    // Precio promedio por litro (ponderado)
    const precio_promedio_litro = total_diesel_litros > 0 ? (total_diesel_monto / total_diesel_litros) : 0;

    // Litros que DEBERÍA haber consumido según tabulador
    const litros_tabulados = rend_tab > 0 ? (kms / rend_tab) : 0;

    // Diferencia en litros (positivo = gastó más, negativo = ahorró)
    const diferencia_litros = total_diesel_litros - litros_tabulados;

    // Diferencia en pesos CON IVA
    const diferencia_pesos_con_iva = diferencia_litros * precio_promedio_litro;

    // Diferencia SIN IVA (para ajuste de comisión)
    const diferencia_sin_iva = diferencia_pesos_con_iva / 1.16;

    // Determinar resultado del rendimiento (tolerancia de 0.1 litros)
    let da_sin_iva = 0; // Diesel a favor
    let de_sin_iva = 0; // Diesel en contra
    let res_rendimiento = ResultadoRendimiento.NEUTRO;

    const TOLERANCIA = 0.1;

    if (diferencia_litros > TOLERANCIA) {
      // Gastó MÁS diesel del esperado → EN CONTRA
      de_sin_iva = Math.abs(diferencia_sin_iva);
      res_rendimiento = ResultadoRendimiento.CONTRA;
    } else if (diferencia_litros < -TOLERANCIA) {
      // Gastó MENOS diesel del esperado → A FAVOR
      da_sin_iva = Math.abs(diferencia_sin_iva);
      res_rendimiento = ResultadoRendimiento.FAVOR;
    }

    // ═══════════════════════════════════════════════════
    // 3. BASE PARA COMISIÓN
    // ═══════════════════════════════════════════════════
    const base_comision = total_flete - total_diesel_monto;

    // ═══════════════════════════════════════════════════
    // 4. COMISIÓN (DEPENDE DEL TIPO DE UNIDAD)
    // ═══════════════════════════════════════════════════
    
    let pct_final = Number(liquidacion.comision_porcentaje) || 0;

    // Fallback: auto-detectar si no hay porcentaje asignado
    if (pct_final === 0 && !liquidacion.comision_porcentaje) {
      const tipoUnidad = liquidacion.unidad?.tipo_unidad?.toUpperCase() || '';
      
      if (tipoUnidad.includes('TRACTOCAMION') || tipoUnidad.includes('TRAILER')) {
        pct_final = 18;
      } else if (tipoUnidad.includes('MUDANCERO') || tipoUnidad.includes('MUDANZA')) {
        pct_final = 20;
      } else if (tipoUnidad.includes('CAMIONETA')) {
        pct_final = 0;
      }
    }
    
    // Comisión ESTIMADA (calculada automáticamente)
    const comision_estimada = (base_comision > 0 && pct_final > 0) ? (base_comision * (pct_final / 100)) : 0;

    // Comisión A PAGAR (la que se usará en cálculos)
    const comision_a_pagar = liquidacion.comision_pagada !== null ? Number(liquidacion.comision_pagada) : comision_estimada;

    // ═══════════════════════════════════════════════════
    // 5. TOTAL BRUTO (ANTES del ajuste manual)
    // ═══════════════════════════════════════════════════
    // Comisión + Diesel a favor - Diesel en contra
    const total_bruto_sin_ajuste = comision_a_pagar + da_sin_iva - de_sin_iva;

    // ═══════════════════════════════════════════════════
    // 🔥 6. APLICAR AJUSTE MANUAL (SIEMPRE DESCUENTO)
    // ═══════════════════════════════════════════════════
    // El ajuste manual SIEMPRE resta del total bruto
    // Puede ser positivo (descuento) o negativo (bono excepcional)
    // ⚠️ IMPORTANTE: En el frontend se captura como positivo si es descuento
    const ajuste_manual = Number(liquidacion.ajuste_manual || 0);
    
    // Total bruto DESPUÉS del ajuste manual
    const total_bruto = total_bruto_sin_ajuste - ajuste_manual;

    // ═══════════════════════════════════════════════════
    // 7. TOTAL NETO A PAGAR (sueldo final del operador)
    // ═══════════════════════════════════════════════════
    // Total bruto (ya con ajuste aplicado) - Anticipos
    const total_neto_pagar = total_bruto - suma_anticipos;

    // ═══════════════════════════════════════════════════
    // 🔥 8. UTILIDAD DE LA EMPRESA (AJUSTE SE SUMA AQUÍ)
    // ═══════════════════════════════════════════════════
    // Flete - Diesel - Casetas - Varios - Total Bruto (sin ajuste) - Deducciones + Ajuste
    // 
    // Explicación:
    // - Si el operador pierde $1,000 por ajuste, la empresa gana $1,000
    // - Restamos total_bruto_sin_ajuste (lo que el operador recibiría sin penalización)
    // - Sumamos ajuste_manual (lo que le descontamos al operador)
    const utilidad_viaje = total_flete 
                          - total_diesel_monto 
                          - total_casetas 
                          - total_gastos_varios 
                          - total_bruto_sin_ajuste 
                          - deduc_comerciales 
                          + ajuste_manual;          
    // ═══════════════════════════════════════════════════
    // 9. PREPARAR DATOS PARA ACTUALIZAR
    // ═══════════════════════════════════════════════════
    const updateData = {
      // Totales de gastos e ingresos
      total_combustible: total_diesel_monto,
      total_casetas: total_casetas,
      total_gastos_varios: total_gastos_varios,
      total_costo_fletes: total_flete,
      total_deducciones_comerciales: deduc_comerciales,
      
      // Comisión
      comision_estimada: Number(comision_estimada.toFixed(2)),
      
      // Rendimiento de diesel
      rendimiento_real: rendimiento_real,
      diesel_a_favor_sin_iva: Number(da_sin_iva.toFixed(2)),
      diesel_en_contra_sin_iva: Number(de_sin_iva.toFixed(2)),
      resultado_rendimiento: res_rendimiento,
      
      // Totales finales
      total_bruto: Number(total_bruto.toFixed(2)),
      total_neto_pagar: Number(total_neto_pagar.toFixed(2)),
      utilidad_viaje: Number(utilidad_viaje.toFixed(2)),
      
      // Usuario editor (si se proporciona)
      ...(user ? { usuario_editor: user } : {}),
    };

    // ═══════════════════════════════════════════════════
    // 10. GUARDAR CAMBIOS
    // ═══════════════════════════════════════════════════
    if (manager) {
      await manager.update(Liquidacion, liquidacionId, updateData);
    } else {
      await this.liquidacionesRepository.update(liquidacionId, updateData);
    }

    // ═══════════════════════════════════════════════════
    // 11. RETORNAR LIQUIDACIÓN ACTUALIZADA
    // ═══════════════════════════════════════════════════
    return this.findOne(liquidacionId);
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

  async cambiarEstado(id: number, cambiarEstadoDto: CambiarEstadoDto, user: User) {
    const liquidacion = await this.findOne(id);
    const estadoActual = liquidacion.estado;
    const nuevoEstado = cambiarEstadoDto.estado;

    // ---------------------------------------------------------
    // 1. BLOQUEO DE ESTADOS FINALES
    // ---------------------------------------------------------
    const estadosFinales = [EstadoLiquidacion.PAGADA, EstadoLiquidacion.CANCELADA];
    if (estadosFinales.includes(estadoActual) && user.rol !== UserRole.SISTEMAS) {
      throw new ForbiddenException(`La liquidación está ${estadoActual} y cerrada definitivamente.`);
    }

    // ---------------------------------------------------------
    // 2. VALIDACIÓN DE PERMISOS
    // ---------------------------------------------------------
    
    // CASO A: SISTEMAS (Reglas Especiales)
    if (user.rol === UserRole.SISTEMAS) {
        if (nuevoEstado === EstadoLiquidacion.PAGADA) {
            throw new ForbiddenException('Sistemas no tiene facultades para autorizar PAGOS.');
        }
    } 
    
    // CASO B: RESTO DE ROLES (Validación por Mapa)
    else {
        const transicionesRol = MAPA_TRANSICIONES[user.rol] ?? {};
        const permitidos = transicionesRol[estadoActual] ?? [];

        if (!permitidos.includes(nuevoEstado)) {
          throw new ForbiddenException(`No tienes permisos para cambiar de ${estadoActual} a ${nuevoEstado}.`);
        }
    }

    // ---------------------------------------------------------
    // 3. APLICACIÓN DE CAMBIOS
    // ---------------------------------------------------------
    
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

  async ajustarLiquidacion(id: number, ajustarLiquidacionDto: AjustarLiquidacionDto, user: User) {
    const liquidacion = await this.findOne(id);

    if (![UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS].includes(user.rol)) {
      throw new ForbiddenException('Solo Directores, Administradores y Sistemas pueden ajustar liquidaciones.');
    }

    if (liquidacion.estado !== EstadoLiquidacion.APROBADA) {
      throw new ForbiddenException('Solo se pueden ajustar liquidaciones en estado APROBADA.');
    }

    liquidacion.rendimiento_tabulado = ajustarLiquidacionDto.rendimiento_tabulado;
    liquidacion.comision_porcentaje = ajustarLiquidacionDto.comision_porcentaje;
    liquidacion.ajuste_manual = ajustarLiquidacionDto.ajuste_manual || 0;
    liquidacion.motivo_ajuste = ajustarLiquidacionDto.motivo_ajuste || null;
    liquidacion.usuario_editor = user;

    await this.liquidacionesRepository.save(liquidacion);
    
    const liquidacionActualizada = await this.recalcularTotales(id, user);

    return {
      message: 'Liquidación ajustada correctamente',
      liquidacion: liquidacionActualizada,
    }
  }
}