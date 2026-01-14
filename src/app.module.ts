import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { typeOrmConfig } from './config/typeorm.config';
import { GastoCombustibleModule } from './gasto-combustible/gasto-combustible.module';
import { GastoCasetasModule } from './gasto-casetas/gasto-casetas.module';
import { GastoVariosModule } from './gasto-varios/gasto-varios.module';
import { CostoFletesModule } from './costo-fletes/costo-fletes.module';
import { DeduccionFleteModule } from './deduccion-flete/deduccion-flete.module';
import { AnticiposModule } from './anticipos/anticipos.module';
import { UploadImageModule } from './upload-image/upload-image.module';
import { UnidadesModule } from './unidades/unidades.module';
import { OperadoresModule } from './operadores/operadores.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmailModule } from './email/email.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { NotaModule } from './nota/nota.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10
      }
    ]),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
      inject: [ConfigService]
    }),
    LiquidacionesModule,
    GastoCombustibleModule,
    GastoCasetasModule,
    GastoVariosModule,
    CostoFletesModule,
    DeduccionFleteModule,
    AnticiposModule,
    UploadImageModule,
    UnidadesModule,
    OperadoresModule,
    UsersModule,
    AuthModule,
    EmailModule,
    NotaModule
  ],
  controllers: [AppController],
  providers: [
    AppService, {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ],
})
export class AppModule {}
