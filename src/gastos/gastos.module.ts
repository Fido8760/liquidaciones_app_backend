import { Module } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gasto } from './entities/gasto.entity';
import { TipoGasto } from 'src/tipo-gastos/entities/tipo-gasto.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';
import { UploadImageModule } from 'src/upload-image/upload-image.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto, TipoGasto, Liquidacion]), LiquidacionesModule, UploadImageModule],
  controllers: [GastosController],
  providers: [GastosService],
})
export class GastosModule {}
