import { Module } from '@nestjs/common';
import { FletesService } from './fletes.service';
import { FletesController } from './fletes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { Flete } from './entities/flete.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, Flete ]), LiquidacionesModule],
  controllers: [FletesController],
  providers: [FletesService],
})
export class FletesModule {}
