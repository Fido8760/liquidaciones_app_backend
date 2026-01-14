import { Module } from '@nestjs/common';
import { DeduccionFleteService } from './deduccion-flete.service';
import { DeduccionFleteController } from './deduccion-flete.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from '../liquidaciones/entities/liquidacion.entity';
import { DeduccionFlete } from './entities/deduccion-flete.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Liquidacion, DeduccionFlete ]), LiquidacionesModule],
  controllers: [DeduccionFleteController],
  providers: [DeduccionFleteService],
})
export class DeduccionFleteModule {}
