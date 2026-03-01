import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/user.module';
import { TypeOrmConfigModule } from './modules/typeorm.module';
import { AuthModule } from './modules/auth.module';
import { AppConfigModule } from './modules/config.module';

@Module({
  imports: [
    // Configuration first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database configuration
    TypeOrmConfigModule,

    // Feature modules
    UsersModule,
    AuthModule,
    AppConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
