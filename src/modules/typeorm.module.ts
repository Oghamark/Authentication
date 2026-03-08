import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../infrastructure/database/entities/user.entity';
import { RefreshTokenEntity } from '../infrastructure/database/entities/refresh_token.entity';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';
import { SchemaUpdate1754842692371 } from '../migrations/1754842692371-schema-update';
import { SchemaUpdate1754842692372 } from '../migrations/1754842692372-schema-update';
import { AuthConfig1772326398310 } from '../migrations/1772326398310-auth-config';
import { OidcConfig1772326398311 } from '../migrations/1772326398311-oidc-config';
import { UniqueUserEmail1773181138305 } from '../migrations/1773181138305-unique-user-email';
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
          entities: [UserEntity, RefreshTokenEntity, AuthConfigEntity],
          migrations: [
            SchemaUpdate1754842692371,
            SchemaUpdate1754842692372,
            AuthConfig1772326398310,
            OidcConfig1772326398311,
            UniqueUserEmail1773181138305,
          ],
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
