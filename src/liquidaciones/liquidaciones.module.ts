import { Module } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { LiquidacionesController } from './liquidaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from './entities/liquidacion.entity';
import { Unidad } from '../database/entities/unidad.entity';
import { Operador } from '../database/entities/operador.entity';
import { GastoCombustible } from '../gasto-combustible/entities/gasto-combustible.entity';
import { Flete } from '../fletes/entities/flete.entity';
import { Anticipo } from '../anticipos/entities/anticipo.entity';
import { User } from 'src/users/entities/user.entity';
import { LiquidacionCalculosService } from './services/liquidacion-calculos.service';
import { LiquidacionValidacionesService } from './services/liquidacion-validaciones.service';
import { LiquidacionWorkflowService } from './services/liquidacion-workflow.service';
import { Gasto } from 'src/gastos/entities/gasto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Liquidacion,
      Unidad,
      Operador,
      GastoCombustible,
      Flete,
      Anticipo,
      User,
      Gasto,
    ]),
  ],
  controllers: [LiquidacionesController],
  providers: [
    LiquidacionesService,
    LiquidacionCalculosService,
    LiquidacionValidacionesService,
    LiquidacionWorkflowService,
  ],
  exports: [LiquidacionesService],
})
export class LiquidacionesModule {}
