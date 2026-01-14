import { Controller, Get, Post, Body, Param, Delete, Query, Put, Patch, ParseIntPipe } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { CreateLiquidacioneDto } from './dto/create-liquidacione.dto';
import { UpdateLiquidacioneDto } from './dto/update-liquidacione.dto';
import { ValidarIdPipe } from '../common/pipes/validar-id/validar-id.pipe';
import { GetLiquidacionQueryDto } from './dto/get-liquidacion.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { AjustarLiquidacionDto } from './dto/ajustar-liquidacion.dto';

@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) {}

  @Post()
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  create(
    @Body() createLiquidacioneDto: CreateLiquidacioneDto,
    @GetUser() user: User
  ) {
    return this.liquidacionesService.create(createLiquidacioneDto, user);
  }

  @Get()
  @Roles(UserRole.CAPTURISTA, UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS)
  findAll(
    @Query() query: GetLiquidacionQueryDto,
  ) {
    const unidad = query.unidad_id ? query.unidad_id : null
    const take = query.take ? +query.take : 10
    const skip = query.skip ? +query.skip : 0

    return this.liquidacionesService.findAll(unidad, take, skip);
  }

  @Get(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS)
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.liquidacionesService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateLiquidacioneDto: UpdateLiquidacioneDto,
    @GetUser() user: User
  ) {
    return this.liquidacionesService.update(+id, updateLiquidacioneDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS)
  remove(
    @Param('id', ValidarIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.liquidacionesService.remove(+id, user);
  }

  @Patch(':id/estado')
  @Roles(UserRole.CAPTURISTA, UserRole.SISTEMAS, UserRole.ADMIN, UserRole.DIRECTOR)
  cambiarEstado(
    @Param('id', ValidarIdPipe) id: string,
    @Body() cambiarEstadoDto: CambiarEstadoDto,
    @GetUser() user: User
  ) {
    return this.liquidacionesService.cambiarEstado(+id, cambiarEstadoDto, user);
  }

  @Patch(':id/ajustar')
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS)
  ajustarLiquidacion(
    @Param('id', ParseIntPipe) id: string,
    @Body() ajustarLiquidacionDto: AjustarLiquidacionDto,
    @GetUser() user: User
  ) {
    return this.liquidacionesService.ajustarLiquidacion(+id, ajustarLiquidacionDto, user);
  }

}
