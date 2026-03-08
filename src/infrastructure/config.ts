import { ConfigType, registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
}));

export const jwtConfig = registerAs('jwt', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiration: (process.env.JWT_ACCESS_EXPIRATION ??
    '15m') as StringValue,
  jwtRefreshExpiration: (process.env.JWT_REFRESH_EXPIRATION ??
    '7d') as StringValue,
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  synchronize: process.env.NODE_ENV !== 'production', // Only synchronize in non-production environments
  logging: process.env.NODE_ENV !== 'production',
}));

export type JwtConfig = ConfigType<typeof jwtConfig>;
export type DatabaseConfig = ConfigType<typeof databaseConfig>;
export type AppConfig = ConfigType<typeof appConfig>;
