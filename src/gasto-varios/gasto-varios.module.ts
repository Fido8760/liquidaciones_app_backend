import { Module } from '@nestjs/common';
import { GastoVariosService } from './gasto-varios.service';
import { GastoVariosController } from './gasto-varios.controller';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { GastoVario } from './entities/gasto-vario.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidacionesModule } from '../liquidaciones/liquidaciones.module';
import { UploadImageModule } from 'src/upload-image/upload-image.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, GastoVario ]), LiquidacionesModule, UploadImageModule],
  controllers: [GastoVariosController],
  providers: [GastoVariosService],
})
export class GastoVariosModule {}
