import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { Liquidacion } from './entities/liquidacion.entity';
import { Unidad } from '../database/entities/unidad.entity';
import { Operador } from '../database/entities/operador.entity';
import { User } from 'src/users/entities/user.entity';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { LiquidacionCalculosService } from './services/liquidacion-calculos.service';
import { LiquidacionWorkflowService } from './services/liquidacion-workflow.service';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { AjustarLiquidacionDto } from './dto/ajustar-liquidacion.dto';
import { ModificarTotalDto } from './dto/moficar-total.dto';
import { obtenerPorcentajeComisionDefault } from './utils/porcentaje-comision.util';

@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectRepository(Liquidacion)
    private readonly liquidacionesRepository: Repository<Liquidacion>,
    @InjectRepository(Unidad)
    private readonly unidadesRepository: Repository<Unidad>,
    @InjectRepository(Operador)
    private readonly operadoresRepository: Repository<Operador>,
    private readonly calculosService: LiquidacionCalculosService,
    private readonly workflowService: LiquidacionWorkflowService,
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

    const tipoUnidad = unidad.tipo_unidad?.toUpperCase() || '';
    const comision_porcentaje_inicial =
      obtenerPorcentajeComisionDefault(tipoUnidad);

    const liquidacionData: Partial<Liquidacion> = {
      ...createLiquidacioneDto,
      unidad,
      operador,
      fecha_inicio: createLiquidacioneDto.fecha_inicio,
      fecha_fin: createLiquidacioneDto.fecha_fin,
      fecha_llegada: createLiquidacioneDto.fecha_llegada,
      usuario_creador: user,
      comision_porcentaje: comision_porcentaje_inicial,
      comision_estimada: 0,
      comision_pagada: null,
      diesel_a_favor_sin_iva: 0,
      diesel_en_contra_sin_iva: 0,
      ajuste_manual: 0,
      total_combustible: 0,
      total_fletes: 0,
      total_gastos: 0,
      total_bruto: 0,
      total_neto_pagar: 0,
      utilidad_viaje: 0,
    };

    const liquidacion =
      await this.liquidacionesRepository.save(liquidacionData);
    return liquidacion;
  }

  async findAll() {
    const liquidaciones = await this.liquidacionesRepository.find({
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
    });

    return liquidaciones;
  }

  async findAllLista(
    take: number,
    skip: number,
    filtros?: {
      operadorId?: number;
      unidadId?: number;
      folio?: string;
      fechaInicio?: string;
      fechaFin?: string;
      orden?: 'ASC' | 'DESC';
    },
  ) {
    const qb = this.liquidacionesRepository
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.unidad', 'unidad')
      .leftJoinAndSelect('l.operador', 'operador')
      .leftJoin('l.usuario_creador', 'creador')
      .leftJoin('l.usuario_editor', 'editor')
      .addSelect([
        'creador.id',
        'creador.nombre',
        'creador.apellido',
        'creador.email',
        'creador.rol',
        'editor.id',
        'editor.nombre',
        'editor.apellido',
        'editor.email',
        'editor.rol',
      ])
      .orderBy('l.id', filtros?.orden ?? 'DESC')
      .take(take)
      .skip(skip);

    if (filtros?.operadorId) {
      qb.andWhere('operador.id = :operadorId', {
        operadorId: filtros.operadorId,
      });
    }

    if (filtros?.unidadId) {
      qb.andWhere('unidad.id = :unidadId', { unidadId: filtros.unidadId });
    }

    if (filtros?.folio) {
      qb.andWhere('l.folio_liquidacion LIKE :folio', {
        folio: `%${filtros.folio}%`,
      });
    }

    if (filtros?.fechaInicio) {
      qb.andWhere('l.fecha_inicio >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    }

    if (filtros?.fechaFin) {
      qb.andWhere('l.fecha_inicio <= :fechaFin', {
        fechaFin: filtros.fechaFin,
      });
    }

    const [liquidaciones, total] = await qb.getManyAndCount();
    return { liquidaciones, total };
  }

  async findOne(id: number) {
    const liquidacion = await this.liquidacionesRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        unidad: true,
        operador: true,
        gastos_combustible: true,
        gastos: true,
        fletes: true,
        anticipos: true,
        usuario_creador: true,
        usuario_editor: true,
        usuario_aprobador: true,
        usuario_pagador: true,
        usuario_modificador_total: true,
        usuario_modificador_comision: true,
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
          rol: true,
        },
        usuario_pagador: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        usuario_modificador_total: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        usuario_modificador_comision: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
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

  async update(
    id: number,
    updateLiquidacionDto: UpdateLiquidacioneDto,
    user: User,
  ) {
    const liquidacion = await this.findOne(id);

    validarBloqueoEdicion(liquidacion, user);

    // Desestructura los campos que manejas aparte
    const {
      fecha_inicio,
      fecha_fin,
      fecha_llegada,
      unidadId,
      operadorId,
      ...resto
    } = updateLiquidacionDto;

    // Asigna solo los campos planos
    Object.assign(liquidacion, resto);

    // Convierte fechas si vienen en el DTO
    if (fecha_inicio) liquidacion.fecha_inicio = fecha_inicio;
    if (fecha_fin) liquidacion.fecha_fin = fecha_fin;
    if (fecha_llegada) liquidacion.fecha_llegada = fecha_llegada;

    if (unidadId) {
      const unidad = await this.unidadesRepository.findOneBy({ id: unidadId });
      if (!unidad) throw new NotFoundException('La unidad no existe');
      liquidacion.unidad = unidad;
    }

    if (operadorId) {
      const operador = await this.operadoresRepository.findOneBy({
        id: operadorId,
      });
      if (!operador) throw new NotFoundException('El operador no existe');
      liquidacion.operador = operador;
    }

    liquidacion.usuario_editor = user;

    await this.liquidacionesRepository.save(liquidacion);
    return this.calculosService.recalcularTotales(liquidacion.id, user);
  }

  async remove(id: number, user: User) {
    const liquidacion = await this.findOne(id);

    validarBloqueoEdicion(liquidacion, user);

    liquidacion.usuario_editor = user;
    await this.liquidacionesRepository.update(id, { usuario_editor: user });
    await this.liquidacionesRepository.softRemove(liquidacion);
    return { message: 'Liquidación eliminada correctamente' };
  }

  async recalcularTotales(liquidacionId: number, user?: User, manager?: any) {
    return this.calculosService.recalcularTotales(liquidacionId, user, manager);
  }

  async pasarARevisionSiBorrador(liquidacionId: number, user?: User) {
    return this.workflowService.pasarARevisionSiBorrador(liquidacionId, user);
  }

  async pasarARevisionSiBorradorConManager(
    manager: any,
    liquidacionId: number,
    user?: User,
  ) {
    return this.workflowService.pasarARevisionSiBorradorConManager(
      manager,
      liquidacionId,
      user,
    );
  }

  async cambiarEstado(id: number, dto: CambiarEstadoDto, user: User) {
    return this.workflowService.cambiarEstado(id, dto, user);
  }

  async ajustarLiquidacion(id: number, dto: AjustarLiquidacionDto, user: User) {
    return this.workflowService.ajustarLiquidacion(id, dto, user);
  }

  async modificarTotalPago(id: number, dto: ModificarTotalDto, user: User) {
    return this.workflowService.modificarTotalPago(id, dto, user);
  }
}
