import { ConfigService } from '@nestjs/config'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { join } from 'path'

export const typeOrmConfig = (configService: ConfigService) : TypeOrmModuleOptions => ({
    type: 'mysql',
    host: configService.get('DATABASE_HOST'),
    username: configService.get('DATABASE_USER'),
    port: configService.get('DATABASE_PORT'),
    password: configService.get('DATABASE_PASS'),
    database: configService.get('DATABASE_NAME'),
    logging: true,
    entities: [join(__dirname + '../../**/*.entity.{js,ts}')],
    synchronize: true
})