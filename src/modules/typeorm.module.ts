import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from 'src/infrastructure/database/entities/refresh_token.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { AppConfigEntity } from 'src/infrastructure/database/entities/app_config.entity';
import { SchemaUpdate1754842692371 } from 'src/migrations/1754842692371-schema-update';
import { SchemaUpdate1739836800000 } from 'src/migrations/1739836800000-schema-update';
import { SchemaUpdate1755468318119 } from 'src/migrations/1755468318119-schema-update';
import { SchemaUpdate1772236800000 } from 'src/migrations/1772236800000-schema-update';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        // Validate required environment variables
        const username = configService.get<string>('DATABASE_USERNAME');
        const password = configService.get<string>('DATABASE_PASSWORD');

        if (!username || !password) {
          throw new Error(
            `Missing database credentials. ` +
              `USERNAME: ${!!username}, PASSWORD: ${!!password}`,
          );
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: username,
          password: password,
          database: configService.get<string>(
            'DATABASE_NAME',
            'authentication',
          ),
          entities: [UserEntity, RefreshTokenEntity, AppConfigEntity],
          migrations: [
            SchemaUpdate1754842692371,
            SchemaUpdate1739836800000,
            SchemaUpdate1755468318119,
            SchemaUpdate1772236800000,
          ],
          migrationsRun: true,
          migrationsTableName: 'migration_table',
          synchronize: false,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class TypeOrmConfigModule {}
