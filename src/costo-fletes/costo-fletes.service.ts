import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCostoFleteDto } from './dto/create-costo-flete.dto';
import { UpdateCostoFleteDto } from './dto/update-costo-flete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CostoFlete } from './entities/costo-flete.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { User } from 'src/users/entities/user.entity';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';

@Injectable()
export class CostoFletesService {
  constructor(
    @InjectRepository(CostoFlete) private readonly costoFleteRepository: Repository<CostoFlete>,
    @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCostoFleteDto: CreateCostoFleteDto, user: User) {

    return await this.dataSource.transaction(async manager => {
      const liquidacion = await manager.findOne(Liquidacion,{ 
        where: {
          id: createCostoFleteDto.liquidacionId
        }
      });

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe')
      }
      
      validarBloqueoEdicion(liquidacion, user);

      const costo = manager.create(CostoFlete, {
        ...createCostoFleteDto,
        liquidacion
      })
  
      const saved = await manager.save(costo)
      await this.liquidacionesService.recalcularTotales( liquidacion.id, user, manager)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id, user)
      
      return saved
    });
  }

  async findAll() {

    const [ costosFletes, total ] = await this.costoFleteRepository.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })

    return {
      costosFletes,
      total
    }
  }

  async findOne(id: number) {
    const costoFlete = await this.costoFleteRepository.findOne({
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if(!costoFlete) {
      throw new NotFoundException(`El costo del flete con ID ${id} no existe`)
    }

    return costoFlete
  }

  async update(id: number, updateCostoFleteDto: UpdateCostoFleteDto, user: User) {

    return await this.dataSource.transaction(async manager => {
      const costoFlete = await manager.findOne(CostoFlete, {
        where: {
          id
        },
        relations: ['liquidacion']
      })
      
    if(!costoFlete) {
      throw new NotFoundException(`El costo del flete con ID ${id} no existe`);
    }
    
    validarBloqueoEdicion(costoFlete.liquidacion, user);

    Object.assign(costoFlete, {...updateCostoFleteDto})

    const liquidacionId = costoFlete.liquidacion.id;
    const saved = await manager.save(CostoFlete, costoFlete);
    await this.liquidacionesService.recalcularTotales( liquidacionId, user, manager);

    return saved
    
    })
    

  }

  async remove(id: number, user: User) {

    return await this.dataSource.transaction(async manager => {
      const costoFlete = await manager.findOne(CostoFlete, {
        where: {
          id
        },
        relations: ['liquidacion']
      })

      if(!costoFlete) {
        throw new NotFoundException(`El costo del flete con ID ${id} no existe`)
      }

      validarBloqueoEdicion(costoFlete.liquidacion, user);
      const liquidacionId = costoFlete.liquidacion.id;
      await manager.remove(CostoFlete,costoFlete)
      await this.liquidacionesService.recalcularTotales( liquidacionId, user, manager)
  
      return { message: `Flete Eliminado` };
      
    })
  }
  
}
