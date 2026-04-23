import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Gasto } from './entities/gasto.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { TipoGasto } from 'src/tipo-gastos/entities/tipo-gasto.entity';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { User } from 'src/users/entities/user.entity';
import { UploadImageService } from 'src/upload-image/upload-image.service';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(Liquidacion)
    private readonly liquidacionRepository: Repository<Liquidacion>,
    @InjectRepository(TipoGasto)
    private readonly tipoGastoRepository: Repository<TipoGasto>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly uploadImageService: UploadImageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createGastoDto: CreateGastoDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    let evidenciaUrl = 'default.pdf';
    let evidenciaPublicId = null;

    if (file) {
      const upload = await this.uploadImageService.uploadFile(file);
      evidenciaUrl = upload.secure_url || evidenciaUrl;
      evidenciaPublicId = upload.public_id || null;
    }

    return await this.dataSource.transaction(async (manager) => {
      const liquidacion = await manager.findOne(Liquidacion, {
        where: { id: createGastoDto.liquidacionId },
      });

      if (!liquidacion) {
        throw new NotFoundException('La liquidación no existe');
      }

      validarBloqueoEdicion(liquidacion, user);

      const tipoGasto = await manager.findOne(TipoGasto, {
        where: { id: createGastoDto.tipoGastoId, activo: true },
      });

      if (!tipoGasto) {
        throw new NotFoundException('Tipo de gasto no encontrado');
      }

      const gasto = manager.create(Gasto, {
        monto: createGastoDto.monto,
        descripcion: createGastoDto.descripcion ?? null,
        afecta_operador: createGastoDto.afecta_operador ?? false,
        evidencia: evidenciaUrl,
        evidencia_public_id: evidenciaPublicId,
        liquidacion,
        tipo_gasto: tipoGasto,
      });

      const saved = await manager.save(gasto);
      await this.liquidacionesService.recalcularTotales(
        liquidacion.id,
        user,
        manager,
      );
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(
        manager,
        liquidacion.id,
        user,
      );

      return saved;
    });
  }

  async findByLiquidacion(
    liquidacionId: number,
  ): Promise<{ data: Gasto[]; total: number }> {
    const [data, total] = await this.gastoRepository.findAndCount({
      where: { liquidacion: { id: liquidacionId } },
      relations: ['tipo_gasto'],
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Gasto> {
    const gasto = await this.gastoRepository.findOne({
      where: { id },
      relations: ['tipo_gasto', 'liquidacion'],
    });

    if (!gasto) throw new NotFoundException('Gasto no encontrado');

    return gasto;
  }

  async update(
    id: number,
    updateGastoDto: UpdateGastoDto,
    user: User,
    file?: Express.Multer.File,
  ): Promise<Gasto> {
    return await this.dataSource.transaction(async (manager) => {
      const gasto = await manager.findOne(Gasto, {
        where: { id },
        relations: ['liquidacion', 'tipo_gasto'],
      });

      if (!gasto) {
        throw new NotFoundException(`Gasto no encontrado`);
      }

      validarBloqueoEdicion(gasto.liquidacion, user);

      if (file) {
        if (gasto.evidencia_public_id) {
          await this.uploadImageService.deleteFile(gasto.evidencia_public_id);
        }

        const upload = await this.uploadImageService.uploadFile(file);
        updateGastoDto.evidencia = upload.secure_url;
        gasto.evidencia_public_id = upload.public_id;
      }

      if (updateGastoDto.tipoGastoId) {
        const tipoGasto = await manager.findOne(TipoGasto, {
          where: { id: updateGastoDto.tipoGastoId, activo: true },
        });

        if (!tipoGasto) {
          throw new NotFoundException('tipo de gasto no encontrado');
        }

        gasto.tipo_gasto = tipoGasto;
      }

      Object.assign(gasto, updateGastoDto);

      const liquidacionId = gasto.liquidacion.id;
      const saved = await manager.save(gasto);
      await this.liquidacionesService.recalcularTotales(
        liquidacionId,
        user,
        manager,
      );

      return saved;
    });
  }

  async remove(id: number, user: User): Promise<{ message: string }> {
    return await this.dataSource.transaction(async (manager) => {
      const gasto = await manager.findOne(Gasto, {
        where: { id },
        relations: ['liquidacion'],
      });

      if (!gasto) {
        throw new NotFoundException(`Gasto #${id} no encontrado`);
      }

      validarBloqueoEdicion(gasto.liquidacion, user);

      if (gasto.evidencia_public_id) {
        await this.uploadImageService.deleteFile(gasto.evidencia_public_id);
      }

      const liquidacionId = gasto.liquidacion.id;
      await manager.remove(Gasto, gasto);
      await this.liquidacionesService.recalcularTotales(
        liquidacionId,
        user,
        manager,
      );

      return { message: 'Gasto eliminado correctamente' };
    });
  }

  async toggleAfectaOperador(id: number, user: User): Promise<Gasto> {
    return await this.dataSource.transaction(async (manager) => {
      const gasto = await manager.findOne(Gasto, {
        where: { id },
        relations: ['liquidacion'],
      });

      if (!gasto) throw new NotFoundException('Gasto no encontrado');

      validarBloqueoEdicion(gasto.liquidacion, user);

      gasto.afecta_operador = !gasto.afecta_operador;

      const liquidacionId = gasto.liquidacion.id;
      const saved = await manager.save(Gasto, gasto);
      await this.liquidacionesService.recalcularTotales(
        liquidacionId,
        user,
        manager,
      );

      return saved;
    });
  }
}
