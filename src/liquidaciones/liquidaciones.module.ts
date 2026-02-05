import { Module } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { LiquidacionesController } from './liquidaciones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from './entities/liquidacion.entity';
import { Unidad } from '../database/entities/unidad.entity';
import { Operador } from '../database/entities/operador.entity';
import { GastoCaseta } from '../gasto-casetas/entities/gasto-caseta.entity';
import { GastoCombustible } from '../gasto-combustible/entities/gasto-combustible.entity';
import { GastoVario } from '../gasto-varios/entities/gasto-vario.entity';
import { CostoFlete } from '../costo-fletes/entities/costo-flete.entity';
import { DeduccionFlete } from '../deduccion-flete/entities/deduccion-flete.entity';
import { Anticipo } from '../anticipos/entities/anticipo.entity';
import { User } from 'src/users/entities/user.entity';
import { LiquidacionCalculosService } from './services/liquidacion-calculos.service';
import { LiquidacionValidacionesService } from './services/liquidacion-validaciones.service';
import { LiquidacionWorkflowService } from './services/liquidacion-workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Liquidacion, Unidad, Operador, GastoCaseta, GastoCombustible, GastoVario, CostoFlete, DeduccionFlete, Anticipo, User])],
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService, LiquidacionCalculosService, LiquidacionValidacionesService, LiquidacionWorkflowService],
  exports: [LiquidacionesService]
})
export class LiquidacionesModule {}
