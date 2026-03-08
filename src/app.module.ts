import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/user.module';
import { TypeOrmConfigModule } from './modules/typeorm.module';
import { AuthModule } from './modules/auth.module';
import { AppConfigModule } from './modules/config.module';
import { HealthModule } from './modules/health.module';
import {
  jwtConfig,
  databaseConfig,
  appConfig,
} from 'src/infrastructure/config';

@Module({
  imports: [
    // Configuration first
    ConfigModule.forRoot({
      load: [appConfig, jwtConfig, databaseConfig],
      envFilePath: ['.env', '.env.local'],
      isGlobal: true,
    }),

    // Database configuration
    TypeOrmConfigModule,

    // Feature modules
    UsersModule,
    AuthModule,
    AppConfigModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
