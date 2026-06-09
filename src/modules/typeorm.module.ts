import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  typeOrmEntities,
  typeOrmMigrations,
} from '../infrastructure/database/typeorm-artifacts';
import { type DatabaseConfig, databaseConfig } from 'src/infrastructure/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (databaseConfig: DatabaseConfig) => {
        const logger = new Logger('TypeOrmModule');

        // Validate required environment variables
        const username = databaseConfig.user;
        const password = databaseConfig.password;
        const host = databaseConfig.host;
        const port = databaseConfig.port;
        const database = databaseConfig.name;

        logger.log(`Connecting to ${database} at ${host}:${port}`);

        if (!username || !password) {
          throw new Error(
            `Missing database credentials. ` +
              `USERNAME: ${!!username}, PASSWORD: ${!!password}`,
          );
        }

        return {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          entities: typeOrmEntities,
          migrations: typeOrmMigrations,
          migrationsRun: true,
          migrationsTableName: 'migration_table',
          synchronize: databaseConfig.synchronize,
          logging: databaseConfig.logging,
        };
      },
    }),
  ],
})
export class TypeOrmConfigModule {}
