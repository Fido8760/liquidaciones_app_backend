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
import { DeduccionFlete } from 'src/deduccion-flete/entities/deduccion-flete.entity';

type TransitionMap = Partial<Record<UserRole, Partial<Record<EstadoLiquidacion, EstadoLiquidacion[]>>>>;

const MAPA_TRANSICIONES: TransitionMap = {
  [UserRole.CAPTURISTA]: {
    [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.EN_REVISION],
    [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.APROBADA],
  },
  [UserRole.DIRECTOR]: {
    [EstadoLiquidacion.BORRADOR]: [EstadoLiquidacion.CANCELADA],
    [EstadoLiquidacion.EN_REVISION]: [EstadoLiquidacion.CANCELADA, EstadoLiquidacion.APROBADA], // Opcional: si Director también aprueba
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

    return this.liquidacionesRepository.save({
      ...createLiquidacioneDto,
      unidad,
      operador,
      usuario_creador: user,
      // Inicializar campos calculados en 0
      rendimiento_ajustado: 0,
      comision_porcentaje: 0,
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
    return await this.liquidacionesRepository.save(liquidacion);
  }

  async remove(id: number, user: User) {
    const liquidacion = await this.findOne(id);

    validarBloqueoEdicion(liquidacion, user);

    liquidacion.usuario_editor = user;
    await this.liquidacionesRepository.update(id, { usuario_editor: user });

    await this.liquidacionesRepository.softRemove(liquidacion);
    return { message: 'Liquidación eliminada correctamente' };
  }

  async recalcularTotales(liquidacionId: number, user?: User) {

    const liquidacion = await this.liquidacionesRepository.findOne({
      where: { id: liquidacionId },
      relations: ['deducciones', 'anticipos'],
    });

    if (!liquidacion) {
      throw new NotFoundException('La liquidación no existe');
    }

    const [ combustibleResult, casetasResult, gastosVariosResult, costosFletesResult, deduccionesComercialesResult, anticiposResult ] = await Promise.all([
      this.gastoCombustibleRepository
        .createQueryBuilder('gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      this.gastoCasetaRepository
        .createQueryBuilder('gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      this.gastosVariosRepository
        .createQueryBuilder('gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      this.costosFeletesRepository
        .createQueryBuilder('costo')
        .select('COALESCE(SUM(costo.monto), 0)', 'total')
        .where('costo.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      this.liquidacionesRepository
        .createQueryBuilder('liq')
        .leftJoin('liq.deducciones', 'ded')
        .select('COALESCE(SUM(ded.monto), 0)', 'total')
        .where('liq.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      this.liquidacionesRepository
        .createQueryBuilder('liq')
        .leftJoin('liq.anticipos', 'ant')
        .select('COALESCE(SUM(ant.monto), 0)', 'total')
        .where('liq.id = :liquidacionId', { liquidacionId })
        .getRawOne(),
    ]);

    const total_combustible = Number(combustibleResult?.total) || 0;
    const total_casetas = Number(casetasResult?.total) || 0;
    const total_gastos_varios = Number(gastosVariosResult?.total) || 0;
    const total_costo_fletes = Number(costosFletesResult?.total) || 0;
    const total_deducciones_comerciales = Number(deduccionesComercialesResult?.total) || 0;
    const suma_anticipos = Number(anticiposResult?.total) || 0;

    const ingreso_real = total_costo_fletes - total_deducciones_comerciales;
    const total_gastos_operativos = total_combustible + total_casetas + total_gastos_varios;
    const total_bruto = ingreso_real - total_gastos_operativos;

    let comision_monto = 0;
    let total_neto_pagar = 0;
    let utilidad_viaje = total_bruto;

    if (liquidacion.comision_porcentaje > 0) {
      comision_monto = total_bruto * (liquidacion.comision_porcentaje / 100);
      total_neto_pagar = comision_monto - suma_anticipos - (liquidacion.ajuste_manual || 0);
      utilidad_viaje = total_bruto - comision_monto;
    }

    await this.liquidacionesRepository.update(liquidacionId, {
      total_combustible,
      total_casetas,
      total_gastos_varios,
      total_costo_fletes,
      total_deducciones_comerciales,
      total_bruto,
      total_neto_pagar,
      utilidad_viaje,
      ...(user ? { usuario_editor: user } : {}),
    });

    return this.findOne(liquidacionId);
  }

  async recalcularTotalesConManager( manager: EntityManager, liquidacionId: number, user?: User ) {
    const liquidacion = await manager.findOne(Liquidacion, {
      where: { id: liquidacionId },
      relations: ['deducciones', 'anticipos'],
    });

    if (!liquidacion) {
      throw new NotFoundException('La liquidación no existe');
    }

    const [ combustibleResult, casetasResult, gastosVariosResult, costosFletesResult, deduccionesComercialesResult, anticiposResult ] = await Promise.all([
      manager
        .createQueryBuilder(GastoCombustible, 'gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      manager
        .createQueryBuilder(GastoCaseta, 'gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      manager
        .createQueryBuilder(GastoVario, 'gasto')
        .select('COALESCE(SUM(gasto.monto), 0)', 'total')
        .where('gasto.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      manager
        .createQueryBuilder(CostoFlete, 'costo')
        .select('COALESCE(SUM(costo.monto), 0)', 'total')
        .where('costo.liquidacion.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      manager
        .createQueryBuilder(Liquidacion, 'liq')
        .leftJoin('liq.deducciones', 'ded')
        .select('COALESCE(SUM(ded.monto), 0)', 'total')
        .where('liq.id = :liquidacionId', { liquidacionId })
        .getRawOne(),

      manager
        .createQueryBuilder(Liquidacion, 'liq')
        .leftJoin('liq.anticipos', 'ant')
        .select('COALESCE(SUM(ant.monto), 0)', 'total')
        .where('liq.id = :liquidacionId', { liquidacionId })
        .getRawOne(),
    ]);

    const total_combustible = Number(combustibleResult?.total) || 0;
    const total_casetas = Number(casetasResult?.total) || 0;
    const total_gastos_varios = Number(gastosVariosResult?.total) || 0;
    const total_costo_fletes = Number(costosFletesResult?.total) || 0;
    const total_deducciones_comerciales = Number(deduccionesComercialesResult?.total) || 0;
    const suma_anticipos = Number(anticiposResult?.total) || 0;

    const ingreso_real = total_costo_fletes - total_deducciones_comerciales;
    const total_gastos_operativos = total_combustible + total_casetas + total_gastos_varios;
    const total_bruto = ingreso_real - total_gastos_operativos;

    let comision_monto = 0;
    let total_neto_pagar = 0;
    let utilidad_viaje = total_bruto;

    if (liquidacion.comision_porcentaje > 0) {
      comision_monto = total_bruto * (liquidacion.comision_porcentaje / 100);
      total_neto_pagar = comision_monto - suma_anticipos - (liquidacion.ajuste_manual || 0);
      utilidad_viaje = total_bruto - comision_monto;
    }

    await manager.update(Liquidacion, liquidacionId, {
      total_combustible,
      total_casetas,
      total_gastos_varios,
      total_costo_fletes,
      total_deducciones_comerciales,
      total_bruto,
      total_neto_pagar,
      utilidad_viaje,
      ...(user ? { usuario_editor: user } : {}),
    });
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
    // 2. VALIDACIÓN DE PERMISOS (Aquí decidimos si pasa o no)
    // ---------------------------------------------------------
    
    // CASO A: SISTEMAS (Reglas Especiales)
    if (user.rol === UserRole.SISTEMAS) {
        // Única restricción para Sistemas: No puede Pagar
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
    // 3. APLICACIÓN DE CAMBIOS (Común para todos)
    // ---------------------------------------------------------
    
    liquidacion.estado = nuevoEstado;
    liquidacion.usuario_editor = user;

    // --- EFECTOS SECUNDARIOS ---

    // A) FIRMA DE APROBACIÓN (Capturista finalizando)
    if (nuevoEstado === EstadoLiquidacion.APROBADA && user.rol === UserRole.CAPTURISTA) {
      liquidacion.usuario_aprobador = user;
    }

    // B) PAGO (Director/Admin)
    // El mapa ya validó que solo ellos pueden llegar aquí
    if (nuevoEstado === EstadoLiquidacion.PAGADA) {
      liquidacion.usuario_pagador = user;
      liquidacion.fecha_pago = new Date();
    }

    // C) RECHAZO O CORRECCIÓN (Limpiar firma)
    // Aplica para Director, Admin Y SISTEMAS si regresan la liquidación
    if (estadoActual === EstadoLiquidacion.APROBADA && nuevoEstado === EstadoLiquidacion.EN_REVISION) {
      liquidacion.usuario_aprobador = null;
    }

    // D) CORRECCIÓN DE PAGO (Solo Sistemas podría hacer esto)
    // Si sacamos de PAGADA a cualquier otro lado, limpiamos datos de pago
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

    liquidacion.rendimiento_ajustado = ajustarLiquidacionDto.rendimiento_ajustado;
    liquidacion.comision_porcentaje = ajustarLiquidacionDto.comision_porcentaje;
    liquidacion.ajuste_manual = ajustarLiquidacionDto.ajuste_manual || 0;
    liquidacion.motivo_ajuste = ajustarLiquidacionDto.motivo_ajuste || null;
    liquidacion.usuario_editor = user;

     await this.liquidacionesRepository.save(liquidacion);
    
    // ✅ recalcularTotales ya devuelve el findOne actualizado
    const liquidacionActualizada = await this.recalcularTotales(id, user);

    return {
      message: 'Liquidación ajustada correctamente',
      liquidacion: liquidacionActualizada, // ✅ Usar el resultado de recalcularTotales
    }
  }
}
