import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGastoCasetaDto } from './dto/create-gasto-caseta.dto';
import { UpdateGastoCasetaDto } from './dto/update-gasto-caseta.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GastoCaseta } from './entities/gasto-caseta.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { MetodoPagoCaseta } from './enums/metodo-pago-caseta.enum';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { UploadImageService } from 'src/upload-image/upload-image.service';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class GastoCasetasService {
  constructor(
    @InjectRepository(GastoCaseta) private readonly gastoCasetaRepository: Repository<GastoCaseta>,
    @InjectRepository(Liquidacion) private readonly liquidacionRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly uploadImageService: UploadImageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createGastoCasetaDto: CreateGastoCasetaDto, user: User, file?: Express.Multer.File ) {
    
    let evidenciaUrl = 'default.pdf'
    if (file) {
      const upload = await this.uploadImageService.uploadFile(file)
      evidenciaUrl = upload.secure_url || evidenciaUrl
    }

    return await this.dataSource.transaction( async manager => {
      const liquidacion = await manager.findOne(Liquidacion, {
        where: {
          id: createGastoCasetaDto.liquidacionId
        }
      });

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe')
      }

      validarBloqueoEdicion(liquidacion, user);

      const gasto = manager.create(GastoCaseta,{
        ...createGastoCasetaDto,
        metodo_pago_caseta: createGastoCasetaDto.metodo_pago_caseta as MetodoPagoCaseta,
        evidencia: evidenciaUrl,
        liquidacion
      })
      const saved = await manager.save(gasto)
      await this.liquidacionesService.recalcularTotales(liquidacion.id, user, manager)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id)
      return saved
    })

  }

  async findAll() {
    const [ gastoCasetas, total ] = await this.gastoCasetaRepository.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })
    return {
      gastoCasetas,
      total
    }
  }

  async findOne(id: number) {
    const gastoCaseta = await this.gastoCasetaRepository.findOne({
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if(!gastoCaseta) {
      throw new NotFoundException(`El gasto de caseta con el ID: ${id} no fue encontrado`)
    }

    return gastoCaseta
  }

  async update(id: number, updateGastoCasetaDto: UpdateGastoCasetaDto, user: User,file?: Express.Multer.File) {
    
    if(file) {
      const uploadResult = await this.uploadImageService.uploadFile(file)
      updateGastoCasetaDto.evidencia = uploadResult.secure_url
    }

    return await this.dataSource.transaction( async manager => {
      const gastoCaseta = await manager.findOne(GastoCaseta, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if (!gastoCaseta) {
        throw new NotFoundException('El gasto de caseta no fue encontrado');
      }
      validarBloqueoEdicion(gastoCaseta.liquidacion, user)

      Object.assign( gastoCaseta, {
        ...updateGastoCasetaDto,
        metodo_pago_caseta: updateGastoCasetaDto.metodo_pago_caseta as MetodoPagoCaseta
      }) 

      const liquidacionId = gastoCaseta.liquidacion.id;
      const saved = await manager.save(GastoCaseta, gastoCaseta)
      await this.liquidacionesService.recalcularTotales(liquidacionId, user, manager)
  
      return saved
    })

  }

  async remove(id: number, user: User) {
    return await this.dataSource.transaction( async manager => {
      
      const gastoCaseta = await manager.findOne(GastoCaseta, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if (!gastoCaseta) {
        throw new NotFoundException('El gasto de caseta no fue encontrado');
      }
      validarBloqueoEdicion(gastoCaseta.liquidacion, user)
      const liquidacion = gastoCaseta.liquidacion.id
      await manager.remove(GastoCaseta, gastoCaseta)
      await this.liquidacionesService.recalcularTotales(liquidacion, user, manager)
      return { message : "Gasto Eliminado" }

    })
  }
}
