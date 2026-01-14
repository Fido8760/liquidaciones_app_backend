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
    const { email, password } = createUserDto;
    try {

      const userExists = await this.userRepository.findOne({ where: { email}});
      if ( userExists ) {
        throw new ConflictException(`El correo ${email} ya está registrado`);
      }

      const hashedPassword = await hashPassword(password)

      const newUser = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        createdBy: user
      });
      
      await this.userRepository.save(newUser);
      return { message: 'Usuario creado correctamente' };

    } catch (error) {
      if ( error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error al crear el usuario')
      
    }
  }

  async findAll() {
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
    return {
      total,
      users
    }
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if( !user ) {
      throw new NotFoundException('Usuario no encontrado')
    }

    const { password, token, permisos_especiales,...rest} = user;

    return rest;
  }

  async update(id: number, updateUserDto: UpdateUserDto, user: User) {
    const userToEdit = await this.userRepository.findOneBy({ id  });
     if (!userToEdit) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (userToEdit.email === 'soporte@mudanzasamado.mx') {
      throw new ForbiddenException('Este Usuario Maestro no puede ser modificado ni desactivado');
    }
    delete updateUserDto.password;
    this.userRepository.merge(userToEdit, updateUserDto);
    userToEdit.updatedBy = user;

    await this.userRepository.save(userToEdit);
    return { message: 'Usuario Actualizado Correctamente'};
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
  
  async cambiarEstado(id: number, cambiarEstadoUsuarioDTO: CambiarEstadoUsuarioDTO, user: User) {
    const usertToUpdate = await this.userRepository.findOneBy({ id });
    if( !usertToUpdate ) {
      throw new NotFoundException('Usuario no encontrado')
    }

    if(usertToUpdate.email === 'soporte@mudanzasamado.mx') {
      throw new ForbiddenException('Este Usuario Maestro no puede ser desactivado')
    }

    usertToUpdate.activo = cambiarEstadoUsuarioDTO.activo;
    usertToUpdate.updatedBy = user;

    await this.userRepository.save(usertToUpdate);

    return {
      message: usertToUpdate.activo
        ? 'Usuario reactivado correctamente'
        : 'Usuario desactivado correctamente',
    };
  }
}

