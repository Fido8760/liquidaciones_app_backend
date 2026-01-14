import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { DeduccionFleteService } from './deduccion-flete.service';
import { CreateDeduccionFleteDto } from './dto/create-deduccion-flete.dto';
import { UpdateDeduccionFleteDto } from './dto/update-deduccion-flete.dto';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('deduccion-flete')
export class DeduccionFleteController {
  constructor(private readonly deduccionFleteService: DeduccionFleteService) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  create(
    @Body() createDeduccionFleteDto: CreateDeduccionFleteDto,
    @GetUser() user: User
  ) {
    return this.deduccionFleteService.create(createDeduccionFleteDto, user);
  }

  @Get()
  findAll() {
    return this.deduccionFleteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.deduccionFleteService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateDeduccionFleteDto: UpdateDeduccionFleteDto,
    @GetUser() user: User
  ) {
    return this.deduccionFleteService.update(+id, updateDeduccionFleteDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.deduccionFleteService.remove(+id, user);
  }
}
