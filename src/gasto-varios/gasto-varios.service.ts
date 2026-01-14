import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGastoVarioDto } from './dto/create-gasto-vario.dto';
import { UpdateGastoVarioDto } from './dto/update-gasto-vario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { GastoVario } from './entities/gasto-vario.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from '../liquidaciones/entities/liquidacion.entity';
import { LiquidacionesService } from '../liquidaciones/liquidaciones.service';
import { UploadImageService } from 'src/upload-image/upload-image.service';
import { User } from 'src/users/entities/user.entity';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';

@Injectable()
export class GastoVariosService {

  constructor(
    @InjectRepository(GastoVario) private readonly gastosVariosRepository: Repository<GastoVario>,
    @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly uploadImageService: UploadImageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createGastoVarioDto: CreateGastoVarioDto, user: User ,file?: Express.Multer.File) {
    
    let evidenciaUrl = 'default.pdf'
    if(file) {
      const upload = await this.uploadImageService.uploadFile(file)
      evidenciaUrl = upload.secure_url || evidenciaUrl
    }
    
    return await this.dataSource.transaction(async manager => {
      
      const liquidacion = await manager.findOne(Liquidacion, {
        where: {
          id: createGastoVarioDto.liquidacionId
        }
      });

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe')
      }
  
      validarBloqueoEdicion(liquidacion, user);

      const gasto = manager.create(GastoVario, {
        ...createGastoVarioDto,
        evidencia: evidenciaUrl,
        liquidacion
      });
  
      const saved = await manager.save(GastoVario, gasto)
      await this.liquidacionesService.recalcularTotalesConManager(manager, liquidacion.id, user)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id, user)
      return saved
    });
    


  }

  async findAll() {
    const [ gastosVarios, total ] = await this.gastosVariosRepository.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })

    return {
      gastosVarios,
      total
    }
  }

  async findOne(id: number) {
    const gastoVario = await this.gastosVariosRepository.findOne({
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if(!gastoVario) {
      throw new NotFoundException(`El gasto con ID ${id} no existe`)
    }

    return gastoVario;
  }

async update(id: number, updateGastoVarioDto: UpdateGastoVarioDto, user: User,file?: Express.Multer.File) {
  if(file) {
    const uploadResult = await this.uploadImageService.uploadFile(file)
    updateGastoVarioDto.evidencia = uploadResult.secure_url
  }
  
    return await this.dataSource.transaction(async manager => {
      const gastoVario = await manager.findOne(GastoVario, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if(!gastoVario) {
        throw new NotFoundException('el gasto no fue encontrado');
      }
      
      validarBloqueoEdicion(gastoVario.liquidacion, user);
      Object.assign(gastoVario, {
        ...updateGastoVarioDto
      })
    
      const liquidacionId = gastoVario.liquidacion.id;
      const saved = await manager.save(GastoVario, gastoVario);
      await this.liquidacionesService.recalcularTotalesConManager(manager, liquidacionId, user);

      return saved
    })

  }

  async remove(id: number, user: User) {

    return await this.dataSource.transaction(async manager => {
      const gastoVarios = await manager.findOne(GastoVario, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if(!gastoVarios) {
        throw new NotFoundException('el gasto no fue encontrado');
      }
      validarBloqueoEdicion(gastoVarios.liquidacion, user);
      const liquidacionId = gastoVarios.liquidacion.id;
      await manager.remove(GastoVario, gastoVarios);
      await this.liquidacionesService.recalcularTotalesConManager(manager, liquidacionId, user);
      
      return { message: 'Gasto Eliminado' };

    })
  }
}
