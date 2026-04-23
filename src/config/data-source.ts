import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: +(process.env.DATABASE_PORT ?? '3306'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  logging: false,
  entities: [path.resolve(process.cwd(), 'src', '**', '*.entity.{js,ts}')],
  migrations: [path.resolve(process.cwd(), 'src', 'migrations', '*.{js,ts}')],
  synchronize: false,
});
