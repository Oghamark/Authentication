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
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { LoginUseCase } from 'src/application/use_cases/auth/login';
import { ThirdPartyLoginUseCase } from 'src/application/use_cases/auth/third_party_login';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';

import {
  JwtAccessTokenStrategy,
  JwtRefreshTokenStrategy,
} from 'src/infrastructure/strategies/jwt.strategy';
import { ValidateUserUseCase } from 'src/application/use_cases/auth/validate_user';
import { VerifyRefreshTokenUseCase } from 'src/application/use_cases/auth/verify_refresh_token';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { LogoutUseCase } from 'src/application/use_cases/auth/logout';
import { jwtConfig, type JwtConfig } from 'src/infrastructure/config';
import { OidcStrategyFactory } from 'src/infrastructure/strategies/oidc.strategy';
import { LdapStrategyFactory } from 'src/infrastructure/strategies/ldap.strategy';
import { OidcStateService } from 'src/infrastructure/oidc-state.service';
import { OidcAuthGuard } from 'src/infrastructure/guards/oidc_auth.guard';
import { OidcExceptionFilter } from 'src/infrastructure/filters/oidc-exception.filter';
import { GenericFailure } from 'src/core/failure';
import { Result } from 'src/core/result';

import { Inject } from '@nestjs/common';
import { LocalAuthGuard } from 'src/infrastructure/guards/local_auth.guard';
import { LdapAuthGuard } from 'src/infrastructure/guards/ldap_auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    TypeOrmModule.forFeature([AuthConfigEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: JwtConfig) => ({
        signOptions: { expiresIn: config.jwtAccessExpiration },
      }),
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
    OidcStrategyFactory,
    OidcAuthGuard,
    LocalAuthGuard,
    LdapAuthGuard,
    // OIDC state service for managing returnTo state between start and callback
    OidcStateService,
    // Exception filter to map OIDC errors to redirects or JSON
    OidcExceptionFilter,

    LdapStrategyFactory,

    // Use cases
    CreateUserUseCase,
    GetAuthConfigUseCase,
    LoginUseCase,
    LogoutUseCase,
    ThirdPartyLoginUseCase,
    ValidateUserUseCase,
    VerifyRefreshTokenUseCase,
  ],
  exports: [
    'RefreshTokenRepository',
    'UserRepository',
    'TokenGateway',
    'CryptoGateway',
    'AuthConfigRepository',
    OidcStrategyFactory,
    LdapStrategyFactory,
  ],
})
export class AuthModule {
  constructor(
    private oidcStrategyFactory: OidcStrategyFactory,
    private ldapStrategyFactory: LdapStrategyFactory,
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  async onModuleInit() {
    const configResult = await this.authConfigRepository.get();
    if (configResult.isFailure()) {
      return Result.fail(new GenericFailure('Failed to load auth config'));
    } else {
      const authConfig = configResult.value!;

      await this.oidcStrategyFactory.createStrategy(authConfig);
      await this.ldapStrategyFactory.createStrategy(authConfig);
    }
  }
}
