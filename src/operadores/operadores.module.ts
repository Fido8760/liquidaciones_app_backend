import { Module } from '@nestjs/common';
import { OperadoresService } from './operadores.service';
import { OperadoresController } from './operadores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operador } from 'src/database/entities/operador.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Operador, Liquidacion])],
  controllers: [OperadoresController],
  providers: [OperadoresService],
})
export class OperadoresModule {}
