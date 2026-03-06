import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from 'src/infrastructure/database/entities/refresh_token.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { BcryptCryptoGateway } from 'src/infrastructure/gateways/bcrypt_crypto.gateway';
import { TypeOrmRefreshTokenRepository } from 'src/infrastructure/repositories/refresh_token_repository';
import { TypeOrmUserRepository } from 'src/infrastructure/repositories/user_repository';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';
import { TypeOrmAuthConfigRepository } from '../infrastructure/repositories/auth_config_repository';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from 'src/infrastructure/strategies/local.strategy';
import { JwtTokenGateway } from 'src/infrastructure/gateways/jwt_token.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { LoginUseCase } from 'src/application/use_cases/auth/login';
import {
  JwtAccessTokenStrategy,
  JwtRefreshTokenStrategy,
} from 'src/infrastructure/strategies/jwt.strategy';
import { ValidateUserUseCase } from 'src/application/use_cases/auth/validate_user';
import { VerifyRefreshTokenUseCase } from 'src/application/use_cases/auth/verify_refresh_token';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { LogoutUseCase } from 'src/application/use_cases/auth/logout';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    TypeOrmModule.forFeature([AuthConfigEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'RefreshTokenRepository',
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: 'UserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'CryptoGateway',
      useClass: BcryptCryptoGateway,
    },
    {
      provide: 'AuthConfigRepository',
      useClass: TypeOrmAuthConfigRepository,
    },
    {
      provide: 'TokenGateway',
      useClass: JwtTokenGateway,
    },

    LocalStrategy,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,

    // Use cases
    CreateUserUseCase,
    GetAuthConfigUseCase,
    LoginUseCase,
    LogoutUseCase,
    ValidateUserUseCase,
    VerifyRefreshTokenUseCase,
  ],
  exports: [
    'RefreshTokenRepository',
    'UserRepository',
    'TokenGateway',
    'CryptoGateway',
    'AuthConfigRepository',
  ],
})
export class AuthModule {}
