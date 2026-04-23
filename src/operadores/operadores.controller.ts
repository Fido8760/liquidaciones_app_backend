import { Controller, Get, Param, Query } from '@nestjs/common';
import { OperadoresService } from './operadores.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/roles-usuarios.enum';
import { ValidarIdPipe } from 'src/common/pipes/validar-id/validar-id.pipe';
import { GetKpisQueryDto } from './dto/kpis-query.dto';

@Controller('operadores')
export class OperadoresController {
  constructor(private readonly operadoresService: OperadoresService) {}

  @Get()
  findAll() {
    return this.operadoresService.findAll();
  }

  @Get(':id/kpis')
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS)
  getKpis(
    @Param('id', ValidarIdPipe) id: string,
    @Query() query: GetKpisQueryDto,
  ) {
    return this.operadoresService.getKpisOperador(
      +id,
      query.fechaInicio,
      query.fechaFin,
    );
  }

  @Get(':id/liquidaciones')
  @Roles(UserRole.DIRECTOR, UserRole.ADMIN, UserRole.SISTEMAS)
  getLiquidaciones(
    @Param('id', ValidarIdPipe) id: string,
    @Query() query: GetKpisQueryDto,
  ) {
    return this.operadoresService.getLiquidacionesOperador(
      +id,
      query.fechaInicio,
      query.fechaFin,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operadoresService.findOne(+id);
  }
}
