import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Operador } from 'src/database/entities/operador.entity';
import { Repository } from 'typeorm';


@Injectable()
export class OperadoresService {

  constructor(
    @InjectRepository(Operador) private readonly operadoresRepository : Repository<Operador>
  ) {}

  async findAll() {
    const [ operadores, total ] = await this.operadoresRepository.findAndCount({
      order: {
        apellido_p: 'ASC'
      }
    }) 
    return {
      operadores,
      total
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} operadore`;
  }

}
