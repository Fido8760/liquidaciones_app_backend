import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Operador } from 'src/database/entities/operador.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { EstadoLiquidacion } from 'src/liquidaciones/enums/estado-liquidacion.enum';
import { Repository } from 'typeorm';

@Injectable()
export class OperadoresService {
  constructor(
    @InjectRepository(Operador)
    private readonly operadoresRepository: Repository<Operador>,
    @InjectRepository(Liquidacion)
    private readonly liquidacionesRepository: Repository<Liquidacion>,
  ) {}

  async findAll() {
    const [operadores, total] = await this.operadoresRepository.findAndCount({
      where: {
        activo: true,
      },
      order: {
        apellido_p: 'ASC',
      },
    });
    return {
      operadores,
      total,
    };
  }

  async getKpisOperador(
    operadorId: number,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    const qb = this.liquidacionesRepository
      .createQueryBuilder('l')
      .leftJoin('l.unidad', 'unidad')
      .select([
        'COUNT(l.id) AS total_viajes',
        'AVG(l.rendimiento_real) AS rendimiento_real_promedio',
        'AVG(l.rendimiento_tabulado) AS rendimiento_tabulado_promedio',
        'AVG(l.rendimiento_real - l.rendimiento_tabulado) AS diferencia_promedio',
        'SUM(l.comision_pagada) AS comision_total',
        'SUM(l.kilometros_recorridos) AS kilometros_totales',
        'SUM(l.monto_pagado) AS monto_pagado',
      ])
      .where('l.operador = :operadorId', { operadorId })
      .andWhere('l.estado = :estado', { estado: EstadoLiquidacion.PAGADA })
      .andWhere('l.deletedAt IS NULL');

    if (fechaInicio) {
      qb.andWhere('l.fecha_inicio >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      qb.andWhere('l.fecha_inicio <= :fechaFin', { fechaFin });
    }

    const kpis = await qb.getRawOne();

    const unidadesQb = this.liquidacionesRepository
      .createQueryBuilder('l')
      .leftJoin('l.unidad', 'unidad')
      .select([
        'unidad.id          AS id',
        'unidad.no_unidad   AS no_unidad',
        'unidad.tipo_unidad AS tipo_unidad',
        'unidad.u_placas    AS u_placas',
        'COUNT(l.id)        AS total_viajes',
        'AVG(l.rendimiento_real) AS rendimiento_promedio',
        'AVG(l.rendimiento_tabulado) AS rendimiento_tabulado_promedio',
        'SUM(l.monto_pagado) AS monto_pagado',
      ])
      .where('l.operador = :operadorId', { operadorId })
      .andWhere('l.estado = :estado', { estado: EstadoLiquidacion.PAGADA })
      .andWhere('l.deletedAt IS NULL')
      .groupBy('unidad.id')
      .orderBy('total_viajes', 'DESC');

    if (fechaInicio) {
      unidadesQb.andWhere('l.fecha_inicio >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      unidadesQb.andWhere('l.fecha_inicio <= :fechaFin', { fechaFin });
    }

    const unidades = await unidadesQb.getRawMany();

    return {
      total_viajes: Number(kpis.total_viajes) || 0,
      rendimiento_real_promedio: Number(kpis.rendimiento_real_promedio) || 0,
      rendimiento_tabulado_promedio:
        Number(kpis.rendimiento_tabulado_promedio) || 0,
      diferencia_promedio: Number(kpis.diferencia_promedio) || 0,
      comision_total: Number(kpis.comision_total) || 0,
      kilometros_totales: Number(kpis.kilometros_totales) || 0,
      monto_pagado_total: Number(kpis.monto_pagado) || 0,
      unidades,
    };
  }

  async getLiquidacionesOperador(
    operadorId: number,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    const qb = this.liquidacionesRepository
      .createQueryBuilder('l')
      .leftJoin('l.unidad', 'unidad')
      .select([
        'l.id                    AS id',
        'l.folio_liquidacion     AS folio_liquidacion',
        'l.fecha_inicio          AS fecha_inicio',
        'l.fecha_fin             AS fecha_fin',
        'l.kilometros_recorridos AS kilometros_recorridos',
        'l.rendimiento_real      AS rendimiento_real',
        'l.rendimiento_tabulado  AS rendimiento_tabulado',
        'l.monto_pagado          AS monto_pagado',
        'l.fecha_pago            AS fecha_pago',
        'unidad.id               AS unidad_id',
        'unidad.no_unidad        AS no_unidad',
        'unidad.tipo_unidad      AS tipo_unidad',
        'unidad.u_placas         AS u_placas',
      ])
      .where('l.operador = :operadorId', { operadorId })
      .andWhere('l.estado = :estado', { estado: EstadoLiquidacion.PAGADA })
      .andWhere('l.deletedAt IS NULL')
      .orderBy('l.fecha_pago', 'DESC');

    if (fechaInicio)
      qb.andWhere('l.fecha_inicio >= :fechaInicio', { fechaInicio });
    if (fechaFin) qb.andWhere('l.fecha_inicio <= :fechaFin', { fechaFin });

    return qb.getRawMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} operadore`;
  }
}
