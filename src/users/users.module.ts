import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Liquidacion } from 'src/liquidaciones/entities/liquidacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Liquidacion])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
