import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe, Put, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { CambiarEstadoUsuarioDTO } from './dto/cambiar-estado-usuario.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SISTEMAS)
  create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: User
  ) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @Roles(UserRole.SISTEMAS)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SISTEMAS)
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.SISTEMAS)
  update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User
  ) {
    return this.usersService.update(+id, updateUserDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.usersService.remove(+id, user);
  }

  @Patch(':id/estado')
  @Roles(UserRole.SISTEMAS)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() cambiarEstadoUsuarioDTO: CambiarEstadoUsuarioDTO,
    @GetUser() user: User
  ) {
    return this.usersService.cambiarEstado(id, cambiarEstadoUsuarioDTO, user)
  }
}
