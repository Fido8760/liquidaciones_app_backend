import { Module } from '@nestjs/common';
import { NotaService } from './nota.service';
import { NotaController } from './nota.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nota } from './entities/nota.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Nota, Liquidacion]), AuthModule],
  controllers: [NotaController],
  providers: [NotaService],
})
export class NotaModule {}
