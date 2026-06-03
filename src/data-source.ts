import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import {
  typeOrmEntities,
  typeOrmMigrations,
  typeOrmSubscribers,
} from './infrastructure/database/typeorm-artifacts';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT!,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  dropSchema: false,
  logging: false,
  logger: 'file',
  entities: typeOrmEntities,
  migrations: typeOrmMigrations,
  subscribers: typeOrmSubscribers,
  migrationsTableName: 'migration_table',
});
