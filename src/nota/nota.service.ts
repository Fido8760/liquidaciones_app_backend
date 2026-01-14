import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nota } from './entities/nota.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';

@Injectable()
export class NotaService {
  constructor(
    @InjectRepository(Nota) private readonly notaRespository: Repository<Nota>,
    @InjectRepository(Liquidacion) private readonly liquidacionRespository: Repository<Liquidacion>
  ) {}
  async create(createNotaDto: CreateNotaDto, user: User, liquidacionId: number) {
    const liquidacion = await this.liquidacionRespository.findOneBy({ id: liquidacionId });
    if (!liquidacion) {
      throw new NotFoundException('La liquidación no existe')
    }

    const nota = this.notaRespository.create({
      contenido: createNotaDto.contenido,
      usuario: user,
      liquidacion: liquidacion
    });

    await this.notaRespository.save(nota);
    return { message: 'Nota creada', nota }

  }

  async findAll(liquidacionId: number) {
    return this.notaRespository.find({
      where: {
        liquidacion: {
          id: liquidacionId
        }
      },
      relations: {
        usuario: true
      },
      select: {
        usuario: {
          id: true,
          nombre: true,
          apellido: true,
          email: true
        }
      },
      order: {
        createdAt: 'ASC'
      }
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} nota`;
  }

  update(id: number, updateNotaDto: UpdateNotaDto) {
    return `This action updates a #${id} nota`;
  }

  remove(id: number) {
    return `This action removes a #${id} nota`;
  }
}
