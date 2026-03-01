import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../infrastructure/database/entities/user.entity';
import { RefreshTokenEntity } from '../infrastructure/database/entities/refresh_token.entity';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';

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
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class TypeOrmConfigModule {}
