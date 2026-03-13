import { ConflictException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { hashPassword } from 'src/utils/auth';
import { CambiarEstadoUsuarioDTO } from './dto/cambiar-estado-usuario.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Liquidacion) private readonly liquidacionRepository: Repository<Liquidacion>,
  ) {}

  async create(createUserDto: CreateUserDto, user: User) {
    const existe = await this.userRepository.findOne({
      where: { email: createUserDto.email.trim().toLowerCase() }
    });

    if(existe) {
      throw new ConflictException(`El correo ${createUserDto.email} ya está registrado`);
    }

    const hashedPassword = await hashPassword(createUserDto.password);

    const newUser = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.trim().toLowerCase(),
      nombre: createUserDto.nombre.trim(),
      apellido: createUserDto.apellido.trim(),
      password: hashedPassword,
      createdBy: user,
    });

    return this.userRepository.save(newUser);
  }

  async findAll():Promise<{users: User[], total: number}> {
    const [users, total ] = await this.userRepository.findAndCount({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      order: {
        id: 'ASC'
      }
    })
    return { total, users }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      } 
    });
    
    if( !user ) throw new NotFoundException('Usuario no encontrado');

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, user: User) {
    const userToEdit = await this.userRepository.findOneBy({ id  });
     if (!userToEdit) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (userToEdit.email === 'soporte@mudanzasamado.mx') {
      throw new ForbiddenException('Este Usuario Maestro no puede ser modificado ni desactivado');
    }

    if (updateUserDto.email) updateUserDto.email = updateUserDto.email.trim().toLowerCase();
    if (updateUserDto.nombre) updateUserDto.nombre = updateUserDto.nombre.trim();
    if (updateUserDto.apellido) updateUserDto.apellido = updateUserDto.apellido.trim();

    Object.assign(userToEdit, updateUserDto);
    userToEdit.updatedBy = user;
  
    return this.userRepository.save(userToEdit);
  }

  async remove(id: number, user: User) {
    const userRemove = await this.userRepository.findOneBy({ id });
     if (!userRemove) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (userRemove.email === 'soporte@mudanzasamado.mx') {
      throw new ForbiddenException('Este Usuario Maestro no puede ser eliminado ni desactivado');
    }
    userRemove.deletedBy = user;
    await this.userRepository.save(userRemove);
    await this.userRepository.softRemove(userRemove);
    return { message: 'Usuario eliminado correctamente'};
  }
  
  async cambiarEstado(id: number, cambiarEstadoUsuarioDTO: CambiarEstadoUsuarioDTO, user: User): Promise<User> {
    const usertToUpdate = await this.userRepository.findOneBy({ id });
    if( !usertToUpdate ) throw new NotFoundException('Usuario no encontrado')

    if(usertToUpdate.email === 'soporte@mudanzasamado.mx') {
      throw new ForbiddenException('Este Usuario Maestro no puede ser desactivado')
    }

    usertToUpdate.activo = cambiarEstadoUsuarioDTO.activo;
    usertToUpdate.updatedBy = user;

    return this.userRepository.save(usertToUpdate);
  }
}

