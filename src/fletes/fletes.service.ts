import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFleteDto } from './dto/create-flete.dto';
import { UpdateFleteDto } from './dto/update-flete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Flete } from './entities/flete.entity';
import { DataSource, Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { LiquidacionesService } from 'src/liquidaciones/liquidaciones.service';
import { User } from 'src/users/entities/user.entity';
import { validarBloqueoEdicion } from 'src/utils/validar-bloqueo';

@Injectable()
export class FletesService {
  constructor(
    @InjectRepository(Flete) private readonly fleteRepository: Repository<Flete>,
    @InjectRepository(Liquidacion) private readonly liquidacionesRepository: Repository<Liquidacion>,
    private readonly liquidacionesService: LiquidacionesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createFleteDto: CreateFleteDto, user: User) {

    return await this.dataSource.transaction(async manager => {
      const liquidacion = await manager.findOne(Liquidacion,{ 
        where: { id: createFleteDto.liquidacionId }
      });

      if(!liquidacion) {
        throw new NotFoundException('La liquidación no existe')
      }
      
      validarBloqueoEdicion(liquidacion, user);

      const flete = manager.create(Flete, {
        ...createFleteDto,
        cliente:      createFleteDto.cliente.trim().toUpperCase(),
        origen:       createFleteDto.origen.trim().toUpperCase(),
        destino:      createFleteDto.destino.trim().toUpperCase(),
        descripcion:  createFleteDto.descripcion?.trim(),
        liquidacion, 
      });
  
      const saved = await manager.save(flete)
      await this.liquidacionesService.recalcularTotales( liquidacion.id, user, manager)
      await this.liquidacionesService.pasarARevisionSiBorradorConManager(manager, liquidacion.id, user)
      
      return saved
    });
  }

  async findByLiquidacion(liquidacionId: Liquidacion['id']): Promise<{ fletes: Flete[], total: number }> {

    const [ fletes, total ] = await this.fleteRepository.findAndCount({
      where: { liquidacion: { id: liquidacionId }},
      order: { id: 'ASC'}
    })

    return { fletes, total }
  }

  async findOne(id: number) {
    const flete = await this.fleteRepository.findOne({
      where: { id },
      relations: ['liquidacion']
    });

    if(!flete) throw new NotFoundException('Flete no encontrado');

    return flete;
  }

  async update(id: number, updateFleteDto: UpdateFleteDto, user: User) {

    return await this.dataSource.transaction(async manager => {
      const flete = await manager.findOne(Flete, {
        where: { id },
        relations: ['liquidacion']
      });
      
    if(!flete) {
      throw new NotFoundException(`El costo del flete con ID ${id} no existe`);
    }
    
    validarBloqueoEdicion(flete.liquidacion, user);

    if (updateFleteDto.cliente) updateFleteDto.cliente = updateFleteDto.cliente.trim().toUpperCase();
    if (updateFleteDto.origen) updateFleteDto.origen = updateFleteDto.origen.trim().toUpperCase();
    if (updateFleteDto.destino) updateFleteDto.destino = updateFleteDto.destino.trim().toUpperCase();
    if (updateFleteDto.descripcion) updateFleteDto.descripcion = updateFleteDto.descripcion.trim();

    Object.assign(flete, updateFleteDto);

    const liquidacionId = flete.liquidacion.id;
    const saved = await manager.save(flete);
    await this.liquidacionesService.recalcularTotales( liquidacionId, user, manager);

    return saved
    
    })
  
  }

  async remove(id: number, user: User): Promise<{message: string}> {

    return await this.dataSource.transaction(async manager => {
      const flete = await manager.findOne(Flete, {
        where: {
          id
        },
        relations: ['liquidacion']
      })

      if(!flete) {
        throw new NotFoundException(`El costo del flete con ID ${id} no existe`)
      }

      validarBloqueoEdicion(flete.liquidacion, user);
      const liquidacionId = flete.liquidacion.id;
      await manager.remove(Flete, flete)
      await this.liquidacionesService.recalcularTotales( liquidacionId, user, manager)
  
      return { message: `Flete Eliminado` };
      
    })
  }
  
}
