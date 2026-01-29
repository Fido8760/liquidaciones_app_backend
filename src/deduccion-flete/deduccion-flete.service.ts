import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeduccionFleteDto } from './dto/create-deduccion-flete.dto';
import { UpdateDeduccionFleteDto } from './dto/update-deduccion-flete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from '../liquidaciones/entities/liquidacion.entity';
import { DeduccionFlete } from './entities/deduccion-flete.entity';
import { DeduccionesFlete } from './enums/deducciones-flete.enum';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class DeduccionFleteService {

  constructor(
    @InjectRepository(DeduccionFlete) private readonly deducionFleteRepository : Repository<DeduccionFlete>,
    @InjectRepository(Liquidacion) private readonly liquidacionRepository: Repository<Liquidacion>,
    private readonly liquidacionesService : LiquidacionesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDeduccionFleteDto: CreateDeduccionFleteDto, user: User) {
    
    return await this.dataSource.transaction(async manager => {
      const liquidacion = await manager.findOne(Liquidacion, {
        where: {
          id: createDeduccionFleteDto.liquidacionId
        }
      });

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe')
      }

      validarBloqueoEdicion(liquidacion, user);
  
      const deduccion = this.deducionFleteRepository.create({
        ...createDeduccionFleteDto,
        liquidacion
      })
  
      const saved = await manager.save(DeduccionFlete, deduccion)

      await this.liquidacionesService.recalcularTotales( liquidacion.id, user, manager )
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id, user)
      return saved
    }) 
  }

  async findAll() {
    const [deducciones, total] = await this.deducionFleteRepository.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })
    return {
      deducciones,
      total
    }
  }

  async findOne(id: number) {
    const deduccion = await this.deducionFleteRepository.findOne({
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if(!deduccion) {
      throw new NotFoundException(`La deducción con el ID: ${id} no fue encontrado`)
    }
    return deduccion
  }

  async update(id: number, updateDeduccionFleteDto: UpdateDeduccionFleteDto, user: User) {
    
    return await this.dataSource.transaction(async manager => {
      const deduccion = await manager.findOne(DeduccionFlete, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if(!deduccion) {
        throw new NotFoundException(`La deducción con el ID: ${id} no fue encontrado`)
      }

      validarBloqueoEdicion(deduccion.liquidacion, user);

      Object.assign(deduccion, {
        ...updateDeduccionFleteDto,
        tipo: updateDeduccionFleteDto.tipo as DeduccionesFlete
      })

      const liquidacionId = deduccion.liquidacion.id;
  
      const saved = await manager.save(DeduccionFlete, deduccion);
      await this.liquidacionesService.recalcularTotales( liquidacionId, user, manager);
      return saved
    })
  }

  async remove(id: number, user: User) {

    return await this.dataSource.transaction( async manager => {
      const deduccion = await manager.findOne(DeduccionFlete, {
        where: {
          id
        },
        relations: ['liquidacion']
      })
      if(!deduccion) {
        throw new NotFoundException(`La deducción con el ID: ${id} no fue encontrado`)
      }

      validarBloqueoEdicion(deduccion.liquidacion, user);

      const liquidacionId = deduccion.liquidacion.id;
      await manager.remove(DeduccionFlete, deduccion);
      await this.liquidacionesService.recalcularTotales(liquidacionId, user, manager);
      return { message: "Gasto Eliminado"}
      
    })
  }
}
