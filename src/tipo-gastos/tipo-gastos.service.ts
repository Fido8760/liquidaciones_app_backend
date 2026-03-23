import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTipoGastoDto } from './dto/create-tipo-gasto.dto';
import { UpdateTipoGastoDto } from './dto/update-tipo-gasto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TipoGasto } from './entities/tipo-gasto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TipoGastosService {

  constructor(
    @InjectRepository(TipoGasto) private readonly tipoGastoRepository: Repository<TipoGasto>
  ){};

  async create(createTipoGastoDto: CreateTipoGastoDto): Promise<TipoGasto> {
    const existe = await this.tipoGastoRepository.findOne({
      where: { nombre: createTipoGastoDto.nombre.toUpperCase() }
    })

    if(existe) {
      throw new ConflictException(`El tipo de gasto ${createTipoGastoDto.nombre.toUpperCase()} ya existe`);
    }

    const tipoGasto = this.tipoGastoRepository.create({
      ...createTipoGastoDto,
      nombre: createTipoGastoDto.nombre.trim().toUpperCase(),
    })

    return this.tipoGastoRepository.save(tipoGasto);
  }

  async findAll(): Promise<{ data: TipoGasto[], total: number }> {
    const [data, total] = await this.tipoGastoRepository.findAndCount({
      order: { nombre: 'ASC'}
    });
    return { data, total}
  }

  async fundActivos(): Promise<TipoGasto[]> {
    return this.tipoGastoRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' }
    })
  }

  async findOne(id: number): Promise<TipoGasto> {

    const tipoGasto = await this.tipoGastoRepository.findOne({
      where: { id }
    });

    if(!tipoGasto) {
      throw new NotFoundException('Tipo de gasto no encontrado');
    }

    return tipoGasto;
  }

  async update(id: number, updateTipoGastoDto: UpdateTipoGastoDto): Promise<TipoGasto> {

    const tipoGasto = await this.findOne(id);
    
    if(updateTipoGastoDto.nombre){
      const nombreMayus = updateTipoGastoDto.nombre.trim().toUpperCase();
      const duplicado = await this.tipoGastoRepository.findOne({
        where: { nombre: nombreMayus}
      });

      if(duplicado && duplicado.id !== id){
        throw new ConflictException(`El tipo de gasto ${updateTipoGastoDto.nombre.toUpperCase()} ya existe`);
      } 

      updateTipoGastoDto.nombre = nombreMayus;
    }
    
    Object.assign(tipoGasto, updateTipoGastoDto)
    return this.tipoGastoRepository.save(tipoGasto);
  }

  async remove(id: number): Promise<{ message: string}> {
    const tipoGasto = await this.findOne(id);
    const tieneGastos = await this.tipoGastoRepository
            .createQueryBuilder('tg')
            .leftJoin('tg.gastos', 'g')
            .where('tg.id = :id', { id })
            .andWhere('g.id IS NOT NULL')
            .getCount();

    if (tieneGastos > 0) {
      throw new ConflictException(
          `No se puede eliminar: el tipo de gasto tiene ${tieneGastos} gasto(s) registrado(s). Desactívalo en su lugar.`
      );
    }

    await this.tipoGastoRepository.remove(tipoGasto);
    return {message: `Se ha eliminado correctamente`};
  }

  async toggleActivo(id: number): Promise<TipoGasto> {
    const tipoGasto = await this.findOne(id);
    tipoGasto.activo = !tipoGasto.activo;
    return this.tipoGastoRepository.save(tipoGasto);
  }
}
