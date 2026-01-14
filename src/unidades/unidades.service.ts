import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Unidad } from 'src/database/entities/unidad.entity';
import { Repository } from 'typeorm';


@Injectable()
export class UnidadesService {

  constructor(
    @InjectRepository(Unidad) private readonly unidadesRepository : Repository<Unidad>
  ) {}
  

  async findAll() {
    const [ unidades, total ] = await this.unidadesRepository.findAndCount({
      order: {
        no_unidad: 'ASC'
      }
    })
    return {
      unidades,
      total
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} unidade`;
  }

}
