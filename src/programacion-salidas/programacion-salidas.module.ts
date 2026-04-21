import { Module } from '@nestjs/common';
import { ProgramacionSalidasService } from './programacion-salidas.service';
import { ProgramacionSalidasController } from './programacion-salidas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unidad } from 'src/database/entities/unidad.entity';
import { ProgramacionSalida } from './entities/programacion-salida.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Unidad, ProgramacionSalida])],
  controllers: [ProgramacionSalidasController],
  providers: [ProgramacionSalidasService],
})
export class ProgramacionSalidasModule {}
