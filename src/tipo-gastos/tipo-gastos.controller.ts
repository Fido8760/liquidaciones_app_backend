import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { TipoGastosService } from './tipo-gastos.service';
import { CreateTipoGastoDto } from './dto/create-tipo-gasto.dto';
import { UpdateTipoGastoDto } from './dto/update-tipo-gasto.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';

@Controller('tipo-gastos')
export class TipoGastosController {
  constructor(private readonly tipoGastosService: TipoGastosService) {}

  @Post()
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  create(@Body() createTipoGastoDto: CreateTipoGastoDto) {
    return this.tipoGastosService.create(createTipoGastoDto);
  }

  @Get()
  findAll() {
    return this.tipoGastosService.findAll();
  }

  @Get('activos')
  findActivos() {
    return this.tipoGastosService.fundActivos();
  }

  @Get(':id')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.tipoGastosService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  update(
    @Param('id', ValidarIdPipe) id: string, 
    @Body() updateTipoGastoDto: UpdateTipoGastoDto) {
    return this.tipoGastosService.update(+id, updateTipoGastoDto);
  }

  @Delete(':id')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  remove(@Param('id', ValidarIdPipe) id: string) {
    return this.tipoGastosService.remove(+id);
  }

  @Patch(':id/toggle-activo')
  @Roles(UserRole.SISTEMAS, UserRole.CAPTURISTA)
  toggleActivo(@Param('id', ValidarIdPipe) id: number) {
    return this.tipoGastosService.toggleActivo(id);
  }
}
