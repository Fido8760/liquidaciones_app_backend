import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AnticiposService } from './anticipos.service';
import { CreateAnticipoDto } from './dto/create-anticipo.dto';
import { UpdateAnticipoDto } from './dto/update-anticipo.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('anticipos')
export class AnticiposController {
  constructor(private readonly anticiposService: AnticiposService) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  create(
    @Body() createAnticipoDto: CreateAnticipoDto,
    @GetUser() user: User
  ) {
    return this.anticiposService.create(createAnticipoDto, user);
  }

  @Get()
  findAll() {
    return this.anticiposService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.anticiposService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateAnticipoDto: UpdateAnticipoDto,
    @GetUser() user: User
  ) {
    return this.anticiposService.update(+id, updateAnticipoDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.anticiposService.remove(+id, user);
  }
}
