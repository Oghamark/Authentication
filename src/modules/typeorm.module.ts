import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../infrastructure/database/entities/user.entity';
import { RefreshTokenEntity } from '../infrastructure/database/entities/refresh_token.entity';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';
import { SchemaUpdate1754842692371 } from '../migrations/1754842692371-schema-update';
import { SchemaUpdate1754842692372 } from '../migrations/1754842692372-schema-update';
import { AuthConfig1772326398310 } from '../migrations/1772326398310-auth-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('TypeOrmModule');
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        // Validate required environment variables
        const username = configService.get<string>('DATABASE_USERNAME');
        const password = configService.get<string>('DATABASE_PASSWORD');
        const host = configService.get<string>('DATABASE_HOST', 'localhost');
        const port = configService.get<number>('DATABASE_PORT', 5432);
        const database = configService.get<string>(
          'DATABASE_NAME',
          'authentication',
        );

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
          ],
          migrationsRun: true,
          migrationsTableName: 'migration_table',
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class TypeOrmConfigModule {}
