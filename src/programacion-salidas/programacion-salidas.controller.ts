import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { ProgramacionSalidasService } from './programacion-salidas.service';
import { CreateProgramacionSalidaDto } from './dto/create-programacion-salida.dto';
import { UpdateProgramacionSalidaDto } from './dto/update-programacion-salida.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { CambiarEstatusDto } from './dto/cambiar-estatus.dto';
import { GetProgramacionSalidasQueryDto } from './dto/get-programacion-salidas.dto';
import { CancelarProgramacionSalidaDto } from './dto/cancelar-programacion-salida.dto';
import { GetSalidaDiaQueryDto } from './dto/programacion-dia.dto';

@Controller('programacion-salidas')
export class ProgramacionSalidasController {
  constructor(
    private readonly programacionSalidasService: ProgramacionSalidasService,
  ) {}

  @Post()
  @Roles(UserRole.VENTAS, UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS)
  create(
    @Body() createProgramacionSalidaDto: CreateProgramacionSalidaDto,
    @GetUser() user: User,
  ) {
    return this.programacionSalidasService.create(
      createProgramacionSalidaDto,
      user,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  findAll(
    @GetUser() user: User,
    @Query() query: GetProgramacionSalidasQueryDto,
  ) {
    const take = query.limit ? +query.limit : 10;
    const page = query.page ? +query.page : 1;
    const skip = (page - 1) * take;

    return this.programacionSalidasService.findAll(user, {
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      take,
      skip,
      page,
    });
  }

  @Get('dia')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  findHoy(@Query() query: GetSalidaDiaQueryDto) {
    return this.programacionSalidasService.findDia(query.fecha);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS)
  getStats(
    @GetUser() user: User,
    @Query() query: GetProgramacionSalidasQueryDto,
  ) {
    return this.programacionSalidasService.getStats(user, {
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  findOne(@Param('id', ValidarIdPipe) id: string) {
    return this.programacionSalidasService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  update(
    @Param('id', ValidarIdPipe) id: string,
    @Body() updateProgramacionSalidaDto: UpdateProgramacionSalidaDto,
    @GetUser() user: User,
  ) {
    return this.programacionSalidasService.update(
      +id,
      updateProgramacionSalidaDto,
      user,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SISTEMAS)
  remove(@Param('id', ValidarIdPipe) id: string, @GetUser() user: User) {
    return this.programacionSalidasService.remove(+id, user);
  }

  @Patch(':id/cancelar')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  cancelarSalida(
    @Param('id', ValidarIdPipe) id: string,
    @Body() cancelarProgramacionSalidaDto: CancelarProgramacionSalidaDto,
    @GetUser() user: User,
  ) {
    return this.programacionSalidasService.cancelar(
      +id,
      cancelarProgramacionSalidaDto,
      user,
    );
  }

  @Patch(':id/estatus')
  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SISTEMAS, UserRole.VENTAS)
  cambiarEstatus(
    @Param('id', ValidarIdPipe) id: string,
    @Body() cambiarEstatusDto: CambiarEstatusDto,
    @GetUser() user: User,
  ) {
    return this.programacionSalidasService.cambiarEstatus(
      +id,
      cambiarEstatusDto,
      user,
    );
  }
}
