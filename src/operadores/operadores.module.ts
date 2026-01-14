import { Module } from '@nestjs/common';
import { OperadoresService } from './operadores.service';
import { OperadoresController } from './operadores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operador } from 'src/database/entities/operador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Operador])],
  controllers: [OperadoresController],
  providers: [OperadoresService],
})
export class OperadoresModule {}
