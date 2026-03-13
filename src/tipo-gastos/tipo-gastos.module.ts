import { Module } from '@nestjs/common';
import { TipoGastosService } from './tipo-gastos.service';
import { TipoGastosController } from './tipo-gastos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoGasto } from './entities/tipo-gasto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoGasto])],
  controllers: [TipoGastosController],
  providers: [TipoGastosService],
})
export class TipoGastosModule {}
