import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGastoCombustibleDto } from './dto/create-gasto-combustible.dto';
import { UpdateGastoCombustibleDto } from './dto/update-gasto-combustible.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GastoCombustible } from './entities/gasto-combustible.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { MetodoPago } from './enums/metodo-pago.enum';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { UploadImageService } from 'src/upload-image/upload-image.service';
import { User } from 'src/users/entities/user.entity';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';

@Injectable()
export class GastoCombustibleService {
  constructor(
    @InjectRepository(GastoCombustible)
    private readonly gastoCombustibleRepository: Repository<GastoCombustible>,
    @InjectRepository(Liquidacion)
    private readonly liquidacionRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly uploadImageService: UploadImageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createGastoCombustibleDto: CreateGastoCombustibleDto,
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
        where: { id: createGastoCombustibleDto.liquidacionId },
      });

      if (!liquidacion) throw new NotFoundException('La liquidación no existe');

      validarBloqueoEdicion(liquidacion, user);

      const litros = Number(
        (
          createGastoCombustibleDto.monto /
          createGastoCombustibleDto.precio_litro
        ).toFixed(2),
      );

      const gasto = manager.create(GastoCombustible, {
        monto: createGastoCombustibleDto.monto,
        precio_litro: createGastoCombustibleDto.precio_litro,
        litros,
        metodo_pago: createGastoCombustibleDto.metodo_pago as MetodoPago,
        evidencia: evidenciaUrl,
        evidencia_public_id: evidenciaPublicId,
        liquidacion,
      });

      const saved = await manager.save(GastoCombustible, gasto);

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

  async findByLiquidacion(liquidacionId: number) {
    const [gastosCombustible, total] =
      await this.gastoCombustibleRepository.findAndCount({
        where: { liquidacion: { id: liquidacionId } },
        order: { id: 'ASC' },
      });

    return { gastosCombustible, total };
  }

  async findOne(id: number) {
    const gastoCombustible = await this.gastoCombustibleRepository.findOne({
      where: { id },
      relations: { liquidacion: true },
    });

    if (!gastoCombustible)
      throw new NotFoundException(
        `El gasto de combustible con el ID: ${id} no fue encontrado`,
      );
    return gastoCombustible;
  }

  async update(
    id: number,
    updateGastoCombustibleDto: UpdateGastoCombustibleDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const gastoCombustible = await manager.findOne(GastoCombustible, {
        where: { id },
        relations: ['liquidacion'],
      });

      if (!gastoCombustible)
        throw new NotFoundException(
          'El gasto de combustible no fue encontrado',
        );

      validarBloqueoEdicion(gastoCombustible.liquidacion, user);

      if (file) {
        if (gastoCombustible.evidencia_public_id) {
          await this.uploadImageService.deleteFile(
            gastoCombustible.evidencia_public_id,
          );
        }

        const upload = await this.uploadImageService.uploadFile(file);
        updateGastoCombustibleDto.evidencia = upload.secure_url;
        gastoCombustible.evidencia_public_id = upload.public_id;
      }

      const monto = updateGastoCombustibleDto.monto ?? gastoCombustible.monto;
      const precio_litro =
        updateGastoCombustibleDto.precio_litro ?? gastoCombustible.precio_litro;
      const litros = Number((Number(monto) / Number(precio_litro)).toFixed(2));

      Object.assign(gastoCombustible, {
        ...updateGastoCombustibleDto,
        litros,
        metodo_pago: updateGastoCombustibleDto.metodo_pago as MetodoPago,
      });

      const liquidacionId = gastoCombustible.liquidacion.id;
      const saved = await manager.save(GastoCombustible, gastoCombustible);
      await this.liquidacionesService.recalcularTotales(
        liquidacionId,
        user,
        manager,
      );

      return saved;
    });
  }

  async remove(id: number, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      const gastoCombustible = await manager.findOne(GastoCombustible, {
        where: {
          id,
        },
        relations: ['liquidacion'],
      });

      if (!gastoCombustible) {
        throw new NotFoundException('Elgasto de combustible no fue encontrado');
      }

      validarBloqueoEdicion(gastoCombustible.liquidacion, user);

      if (gastoCombustible.evidencia_public_id) {
        await this.uploadImageService.deleteFile(
          gastoCombustible.evidencia_public_id,
        );
      }

      const liquidacionId = gastoCombustible.liquidacion.id;
      await manager.remove(GastoCombustible, gastoCombustible);
      await this.liquidacionesService.recalcularTotales(
        liquidacionId,
        user,
        manager,
      );

      return { message: 'Gasto eliminado correctamente' };
    });
  }
}
