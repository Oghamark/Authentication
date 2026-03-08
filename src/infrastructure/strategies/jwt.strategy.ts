import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { Request } from 'express';
import { VerifyRefreshTokenUseCase } from 'src/application/use_cases/auth/verify_refresh_token';
import { InvalidTokenError } from 'src/domain/exceptions/auth.exceptions';
import { JwtConfig, jwtConfig } from 'src/infrastructure/config';

interface Jwt {
  sub: string;
  name: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(jwtConfig.KEY) config: JwtConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies && (request.cookies['access_token'] as string),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret!, // Fallback if secret is not set in sign method
    });
  }

  async validate(payload: Jwt): Promise<UserPrincipal> {
    return Promise.resolve({
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    });
  }
}

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY) jwtConfiguration: JwtConfig,
    private verifyRefreshTokenUseCase: VerifyRefreshTokenUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies && (request.cookies['refresh_token'] as string),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.jwtRefreshSecret!,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: Jwt): Promise<UserPrincipal> {
    const verifyRefreshTokenResult =
      await this.verifyRefreshTokenUseCase.execute({
        refreshToken:
          request?.cookies && (request.cookies['refresh_token'] as string),
        userId: payload.sub,
      });

    if (verifyRefreshTokenResult.isFailure()) {
      throw new InvalidTokenError();
    }

    return verifyRefreshTokenResult.value!;
  }
}
