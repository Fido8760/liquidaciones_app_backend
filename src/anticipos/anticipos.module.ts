import { Module } from '@nestjs/common';
import { AnticiposService } from './anticipos.service';
import { AnticiposController } from './anticipos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { Anticipo } from './entities/anticipo.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, Anticipo]), LiquidacionesModule],
  controllers: [AnticiposController],
  providers: [AnticiposService],
})
export class AnticiposModule {}
