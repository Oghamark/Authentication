import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './infrastructure/filters/domain_exception.filter';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    cors: { origin: process.env.CORS_ORIGIN, credentials: true },
  });

  // Trust the first proxy hop so Express sees the correct protocol and IP
  // when running behind a load balancer or reverse proxy in deployed environments.
  app.set('trust proxy', 1);

  app.useGlobalFilters(new DomainExceptionFilter(new Logger()));
  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true }));
  app.use(cookieParser());

  // Session is only used transiently for OIDC state (nonce, PKCE verifier) during the redirect flow.
  // Auth state is managed via JWT cookies, not server-side sessions.
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  const PgStore = pgSession(session);
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  app.use(
    session({
      store: new PgStore({ pool, tableName: 'session' }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 5, // 5 mins — just long enough for OIDC code exchange
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
