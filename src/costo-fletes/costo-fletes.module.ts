import { Module } from '@nestjs/common';
import { CostoFletesService } from './costo-fletes.service';
import { CostoFletesController } from './costo-fletes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { CostoFlete } from './entities/costo-flete.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, CostoFlete ]), LiquidacionesModule],
  controllers: [CostoFletesController],
  providers: [CostoFletesService],
})
export class CostoFletesModule {}
