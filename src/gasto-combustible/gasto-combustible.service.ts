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
    @InjectRepository(GastoCombustible) private readonly gastoCombustibleRepository: Repository<GastoCombustible>,
    @InjectRepository(Liquidacion) private readonly liquidacionRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly uploadImageService: UploadImageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createGastoCombustibleDto: CreateGastoCombustibleDto, user: User ,file?: Express.Multer.File ) {
    
    let evidenciaUrl = 'default.pdf'
    if (file) {
      const upload = await this.uploadImageService.uploadFile(file)
      evidenciaUrl = upload.secure_url || evidenciaUrl
    }
    
    return await this.dataSource.transaction(async manager => {
      const liquidacion = await manager.findOne(Liquidacion, {
        where: {
          id: createGastoCombustibleDto.liquidacionId
        }
      });

      if (!liquidacion) {
        throw new NotFoundException('La liquidación no existe');
      }

      validarBloqueoEdicion(liquidacion, user);

      const gasto = manager.create(GastoCombustible, {
        ...createGastoCombustibleDto,
        metodo_pago: createGastoCombustibleDto.metodo_pago as MetodoPago,
        evidencia: evidenciaUrl,
        liquidacion
      })

      const saved = await manager.save(GastoCombustible, gasto)

      await this.liquidacionesService.recalcularTotales( liquidacion.id, user, manager)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager( manager, liquidacion.id, user )

      return saved;
    }) 
  }

  async findAll() {
    const [ gastosCombustible, total ] = await this.gastoCombustibleRepository.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })

    return {
      gastosCombustible,
      total
    }
  }

  async findOne(id: number) {
    const gastoCombustible = await this.gastoCombustibleRepository.findOne({ 
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if (!gastoCombustible) {
      throw new NotFoundException(`El gasto de combustible con el ID: ${id} no fue encontrado`)
    }

    return gastoCombustible
  }

  async update(id: number, updateGastoCombustibleDto: UpdateGastoCombustibleDto, user: User ,file?: Express.Multer.File) {
    if (file) {
      const uploadResult = await this.uploadImageService.uploadFile(file)
      updateGastoCombustibleDto.evidencia = uploadResult.secure_url
    }

    return await this.dataSource.transaction(async manager => {
      const gastoCombustible = await manager.findOne(GastoCombustible, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if (!gastoCombustible) {
        throw new NotFoundException('El gasto de combustible no fue encontrado');
      }

      validarBloqueoEdicion(gastoCombustible.liquidacion, user);

      Object.assign(gastoCombustible, {
        ...updateGastoCombustibleDto,
        metodo_pago: updateGastoCombustibleDto.metodo_pago as MetodoPago
      });

      const liquidacionId = gastoCombustible.liquidacion.id;
      const saved = await manager.save(GastoCombustible, gastoCombustible);
      await this.liquidacionesService.recalcularTotales(liquidacionId, user, manager);

      return saved;
    })
  }

  async remove(id: number, user: User) {

    return await this.dataSource.transaction(async manager => {
      const gastoCombustible = await manager.findOne(GastoCombustible, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if(!gastoCombustible) {
        throw new NotFoundException('Elgasto de combustible no fue encontrado');
      }
      
      validarBloqueoEdicion(gastoCombustible.liquidacion, user);

      const liquidacionId = gastoCombustible.liquidacion.id;
      await manager.remove(GastoCombustible, gastoCombustible)
      await this.liquidacionesService.recalcularTotales(liquidacionId, user, manager)

      return { message: "Gasto eliminado correctamente" }
    })
  }
}
