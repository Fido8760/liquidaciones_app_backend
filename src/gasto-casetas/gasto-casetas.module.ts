import { Module } from '@nestjs/common';
import { GastoCasetasService } from './gasto-casetas.service';
import { GastoCasetasController } from './gasto-casetas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { GastoCaseta } from './entities/gasto-caseta.entity';
import { LiquidacionesModule } from 'src/liquidaciones/liquidaciones.module';
import { UploadImageModule } from 'src/upload-image/upload-image.module';

@Module({
  imports: [TypeOrmModule.forFeature([ Liquidacion, GastoCaseta]), LiquidacionesModule, UploadImageModule],
  controllers: [GastoCasetasController],
  providers: [GastoCasetasService],
})
export class GastoCasetasModule {}
