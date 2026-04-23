import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProgramacionSalidaDto } from './dto/create-programacion-salida.dto';
import { UpdateProgramacionSalidaDto } from './dto/update-programacion-salida.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProgramacionSalida } from './entities/programacion-salida.entity';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Unidad } from 'src/database/entities/unidad.entity';
import { User } from 'src/users/entities/user.entity';
import { EstatusSalida } from './enum/estatus-salida.enum';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { CambiarEstatusDto } from './dto/cambiar-estatus.dto';
import { CancelarProgramacionSalidaDto } from './dto/cancelar-programacion-salida.dto';

type FiltrosProgramacion = {
  fechaInicio?: string;
  fechaFin?: string;
};

@Injectable()
export class ProgramacionSalidasService {
  constructor(
    @InjectRepository(ProgramacionSalida)
    private readonly repostorioProgramacion: Repository<ProgramacionSalida>,
    @InjectRepository(Unidad)
    private readonly unidadRepositorio: Repository<Unidad>,
  ) {}

  async create(
    createProgramacionSalidaDto: CreateProgramacionSalidaDto,
    user: User,
  ): Promise<ProgramacionSalida> {
    let unidad: Unidad | null = null;
    if (createProgramacionSalidaDto.unidadId) {
      unidad = await this.unidadRepositorio.findOneBy({
        id: createProgramacionSalidaDto.unidadId,
      });
    }

    const salida = this.repostorioProgramacion.create({
      ...createProgramacionSalidaDto,
      unidad: unidad,
      creadoPor: user,
      estatus: unidad ? EstatusSalida.ASIGNADO : EstatusSalida.SIN_ASIGNAR,
    });

    return this.repostorioProgramacion.save(salida);
  }

  async findAll(
    user: User,
    filtros?: FiltrosProgramacion & {
      take?: number;
      skip?: number;
      page?: number;
    },
  ): Promise<{
    salidas: ProgramacionSalida[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const take = filtros?.take ?? 10;
    const skip = filtros?.skip ?? 0;
    const page = filtros?.page ?? 1;

    const qb = this.createHistoricoQueryBuilder(filtros).take(take).skip(skip);

    const [salidas, total] = await qb.getManyAndCount();

    return {
      salidas,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getStats(user: User, filtros?: FiltrosProgramacion) {
    const totals = await this.createStatsBaseQuery(filtros)
      .select([
        'COUNT(salida.id) AS total_salidas',
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.SIN_ASIGNAR}' THEN 1 ELSE 0 END) AS sin_asignar`, // <--- AGREGAR
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.ASIGNADO}' THEN 1 ELSE 0 END) AS asignados`,
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.SALIO}' THEN 1 ELSE 0 END) AS realizadas`,
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.CANCELADO}' THEN 1 ELSE 0 END) AS canceladas`,
      ])
      .getRawOne();

    const porDia = await this.createStatsBaseQuery(filtros)
      .select('salida.fecha_salida', 'fecha')
      .addSelect('COUNT(salida.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.SALIO}' THEN 1 ELSE 0 END)`,
        'realizadas',
      )
      .addSelect(
        `SUM(CASE WHEN salida.estatus = '${EstatusSalida.CANCELADO}' THEN 1 ELSE 0 END)`,
        'canceladas',
      )
      .groupBy('salida.fecha_salida')
      .orderBy('salida.fecha_salida', 'ASC')
      .getRawMany();

    const porMotivoCancelacion = await this.createStatsBaseQuery(filtros)
      .select('salida.motivo_cancelacion', 'motivo')
      .addSelect('COUNT(salida.id)', 'total')
      .where('salida.estatus = :estatus', { estatus: EstatusSalida.CANCELADO })
      .andWhere('salida.motivo_cancelacion IS NOT NULL')
      .groupBy('salida.motivo_cancelacion')
      .orderBy('total', 'DESC')
      .getRawMany();

    const porCliente = await this.createStatsBaseQuery(filtros)
      .select('salida.cliente', 'cliente')
      .addSelect('COUNT(salida.id)', 'total')
      .groupBy('salida.cliente')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    const totalSalidas = Number(totals?.total_salidas) || 0;
    const sinAsignar = Number(totals?.sin_asignar) || 0;
    const realizadas = Number(totals?.realizadas) || 0;
    const asignados = Number(totals?.asignados) || 0;
    const canceladas = Number(totals?.canceladas) || 0;
    const cumplimiento =
      totalSalidas > 0
        ? Number(((realizadas / totalSalidas) * 100).toFixed(2))
        : 0;

    return {
      total_salidas: totalSalidas,
      sin_asignar: sinAsignar,
      asignados,
      realizadas,
      canceladas,
      cumplimiento,
      por_dia: porDia.map((item) => ({
        fecha: item.fecha,
        total: Number(item.total) || 0,
        realizadas: Number(item.realizadas) || 0,
        canceladas: Number(item.canceladas) || 0,
      })),
      por_motivo_cancelacion: porMotivoCancelacion.map((item) => ({
        motivo: item.motivo,
        total: Number(item.total) || 0,
      })),
      por_cliente: porCliente.map((item) => ({
        cliente: item.cliente,
        total: Number(item.total) || 0,
      })),
      por_estatus: [
        { estatus: EstatusSalida.SIN_ASIGNAR, total: sinAsignar },
        { estatus: EstatusSalida.ASIGNADO, total: asignados },
        { estatus: EstatusSalida.SALIO, total: realizadas },
        { estatus: EstatusSalida.CANCELADO, total: canceladas },
      ],
    };
  }

  async findOne(id: number) {
    const salida = await this.repostorioProgramacion.findOne({
      where: { id },
      relations: {
        unidad: true,
        creadoPor: true,
        modificadoPor: true,
      },
      select: {
        creadoPor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        modificadoPor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
      },
    });
    if (!salida)
      throw new NotFoundException('Programacion de salida no ecnontrada');
    return salida;
  }

  async update(
    id: number,
    updateProgramacionSalidaDto: UpdateProgramacionSalidaDto,
    user: User,
  ): Promise<ProgramacionSalida> {
    const salida = await this.findOne(id);
    this.validarPermisoModificacion(salida, user);

    const { unidadId, ...resto } = updateProgramacionSalidaDto;

    if (unidadId) {
      const unidad = await this.unidadRepositorio.findOneBy({ id: unidadId });
      if (!unidad) throw new NotFoundException('Unidad no encontrada');
      salida.unidad = unidad;
      if (salida.estatus === EstatusSalida.SIN_ASIGNAR) {
        salida.estatus = EstatusSalida.ASIGNADO;
      }
    }

    Object.assign(salida, {
      ...resto,
      modificadoPor: user,
    });

    return this.repostorioProgramacion.save(salida);
  }

  async remove(id: number, user: User) {
    if (user.rol !== UserRole.SISTEMAS) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar el registro',
      );
    }
    const salida = await this.findOne(id);
    await this.repostorioProgramacion.remove(salida);
    return { message: 'Registro eliminado correctamente' };
  }

  async findDia(fecha?: string): Promise<ProgramacionSalida[]> {
    const fechaObjetivo = fecha ?? this.obtenerFechaActual();

    const hoy = new Date();
    const target = new Date(fechaObjetivo + 'T00:00:00');
    const diffDias = Math.floor(
      (target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDias > 7) {
      throw new ForbiddenException(
        'Solo se puede consultar hasta 7 días en el futuro',
      );
    }

    return this.repostorioProgramacion.find({
      where: { fecha_salida: fechaObjetivo as any },
      relations: {
        unidad: true,
        creadoPor: true,
        modificadoPor: true,
      },
      select: {
        creadoPor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
        modificadoPor: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
      },
      order: {
        hora_carga: 'ASC',
      },
    });
  }

  async cancelar(
    id: number,
    dto: CancelarProgramacionSalidaDto,
    user: User,
  ): Promise<ProgramacionSalida> {
    const salida = await this.findOne(id);
    this.validarPermisoModificacion(salida, user);

    salida.estatus = EstatusSalida.CANCELADO;
    salida.motivo_cancelacion = dto.motivo_cancelacion;
    salida.modificadoPor = user;

    return this.repostorioProgramacion.save(salida);
  }

  async cambiarEstatus(
    id: number,
    dto: CambiarEstatusDto,
    user: User,
  ): Promise<ProgramacionSalida> {
    if (dto.estatus === EstatusSalida.CANCELADO) {
      throw new ForbiddenException(
        'Para cancelar una salida debes indicar el motivo de cancelación',
      );
    }

    const salida = await this.findOne(id);
    this.validarPermisoModificacion(salida, user);

    salida.estatus = dto.estatus;
    salida.motivo_cancelacion = null;
    salida.modificadoPor = user;

    return this.repostorioProgramacion.save(salida);
  }

  private createHistoricoQueryBuilder(filtros?: FiltrosProgramacion) {
    const qb = this.repostorioProgramacion
      .createQueryBuilder('salida')
      .leftJoinAndSelect('salida.unidad', 'unidad')
      .leftJoin('salida.creadoPor', 'creadoPor')
      .leftJoin('salida.modificadoPor', 'modificadoPor')
      .addSelect([
        'creadoPor.id',
        'creadoPor.nombre',
        'creadoPor.apellido',
        'creadoPor.email',
        'creadoPor.rol',
        'modificadoPor.id',
        'modificadoPor.nombre',
        'modificadoPor.apellido',
        'modificadoPor.email',
        'modificadoPor.rol',
      ])
      .orderBy('salida.fecha_carga', 'DESC')
      .addOrderBy('salida.hora_carga', 'DESC');

    return this.aplicarFiltrosRangoFecha(qb, filtros);
  }

  private createStatsBaseQuery(filtros?: FiltrosProgramacion) {
    const qb = this.repostorioProgramacion.createQueryBuilder('salida');
    return this.aplicarFiltrosRangoFecha(qb, filtros);
  }

  private aplicarFiltrosRangoFecha<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    filtros?: FiltrosProgramacion,
  ) {
    if (filtros?.fechaInicio) {
      qb.andWhere('salida.fecha_salida >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    }

    if (filtros?.fechaFin) {
      qb.andWhere('salida.fecha_salida <= :fechaFin', {
        fechaFin: filtros.fechaFin,
      });
    }

    return qb;
  }

  private validarPermisoModificacion(salida: ProgramacionSalida, user: User) {
    if (salida.estatus === EstatusSalida.CANCELADO) {
      throw new ForbiddenException(
        'No se puede modificar una salida cancelada',
      );
    }

    if (user.rol === UserRole.SISTEMAS) return;

    const fechaSalida = this.formatearFecha(salida.fecha_salida);
    const hoy = this.obtenerFechaActual();

    if (fechaSalida < hoy) {
      throw new ForbiddenException(
        'Solo Sistemas puede modificar viajes programados en el pasado',
      );
    }
  }

  private obtenerFechaActual() {
    return this.formatearFecha(new Date());
  }

  private formatearFecha(fecha: Date | string): string {
    if (typeof fecha === 'string') {
      // Si ya es string YYYY-MM-DD lo regresamos directo
      return fecha.split('T')[0];
    }
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
