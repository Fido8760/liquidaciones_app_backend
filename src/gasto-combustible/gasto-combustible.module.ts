import { Module } from '@nestjs/common';
import { GastoCombustibleService } from './gasto-combustible.service';
import { GastoCombustibleController } from './gasto-combustible.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from '../liquidaciones/entities/liquidacion.entity';
import { GastoCombustible } from './entities/gasto-combustible.entity';
import { LiquidacionesModule } from '../liquidaciones/liquidaciones.module';
import { UploadImageModule } from 'src/upload-image/upload-image.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, GastoCombustible]), LiquidacionesModule, UploadImageModule],
  controllers: [GastoCombustibleController],
  providers: [GastoCombustibleService],
})
export class GastoCombustibleModule {}
