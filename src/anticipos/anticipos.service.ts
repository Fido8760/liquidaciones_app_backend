import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnticipoDto } from './dto/create-anticipo.dto';
import { UpdateAnticipoDto } from './dto/update-anticipo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Anticipo } from './entities/anticipo.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from '../liquidaciones/entities/liquidacion.entity';
import { AnticipoTipo } from './enums/anticipos.enum';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AnticiposService {

  constructor(
    @InjectRepository(Anticipo) private readonly anticiposRepoitory : Repository<Anticipo>,
    @InjectRepository(Liquidacion) private readonly liquidacionesRepository : Repository<Liquidacion>,
    private readonly liquidacionesService : LiquidacionesService,
    private readonly dataSource: DataSource
  ) {}

  async create(createAnticipoDto: CreateAnticipoDto, user: User) {

    return await this.dataSource.transaction(async manager => {
      const liquidacion = await manager.findOne(Liquidacion, {
        where: {
          id: createAnticipoDto.liquidacionId
        }
      })

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe');
      }
  
      validarBloqueoEdicion(liquidacion, user)
  
      const anticipo = manager.create(Anticipo, {
        ...createAnticipoDto,
        liquidacion
      })
  
      const saved = await manager.save(Anticipo, anticipo)
      await this.liquidacionesService.recalcularTotalesConManager( manager, liquidacion.id, user)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id, user)
      return saved
    })

  }

  async findAll() {
    const [anticipos, total] = await this.anticiposRepoitory.findAndCount({
      relations: {
        liquidacion: true
      },
      order: {
        id: 'ASC'
      }
    })

    return {
      anticipos,
      total
    }
  }

  async findOne(id: number) {
    const anticipo = await this.anticiposRepoitory.findOne({
      where: {
        id
      },
      relations: {
        liquidacion: true
      }
    })

    if(!anticipo) {
      throw new NotFoundException(`El anticipo con el ID: ${id} no fue encontrado`)
    }
    return anticipo

  }

  async update(id: number, updateAnticipoDto: UpdateAnticipoDto, user: User) {
    
    return await this.dataSource.transaction(async manager => {
      
      const anticipo = await manager.findOne(Anticipo, {
        where: {
          id
        },
        relations: ['liquidacion']
      });

      if(!anticipo) {
        throw new NotFoundException(`El anticipo no fue encontrado`)
      }

      validarBloqueoEdicion(anticipo.liquidacion, user);
      
      Object.assign(anticipo, {
        ...updateAnticipoDto,
        tipo: updateAnticipoDto.tipo as AnticipoTipo
      })

      const liquidacionId = anticipo.liquidacion.id;
      const saved = await manager.save(Anticipo, anticipo)
      await this.liquidacionesService.recalcularTotalesConManager(manager, liquidacionId, user);
      return saved
    })

  }

  async remove(id: number, user: User) {
    
    return await this.dataSource.transaction(async manager => {
      
      const anticipo = await manager.findOne(Anticipo, {
        where: {
          id
        },
        relations: ['liquidacion']
      })

      if(!anticipo) {
        throw new NotFoundException(`El anticipo no fue encontrado`)
      }

      validarBloqueoEdicion(anticipo.liquidacion, user);

      const liquidacionId = anticipo.liquidacion.id;

      await manager.remove(Anticipo, anticipo)
      await this.liquidacionesService.recalcularTotalesConManager(manager, liquidacionId, user);
      return { manager: "Anticipo Eliminado" }
    })
  }
}
