import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserResponse } from 'src/application/dtos/user/user_response';
import { Request } from 'express';
import { VerifyRefreshTokenUseCase } from 'src/application/use_cases/auth/verify_refresh_token';
import { InvalidTokenError } from 'src/domain/exceptions/auth.exceptions';

interface Jwt {
  sub: string;
  name: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies && (request.cookies['access_token'] as string),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!, // Fallback if secret is not set in sign method
    });
  }

  async validate(payload: Jwt): Promise<UserResponse> {
    return Promise.resolve({
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.roles[0],
    });
  }
}

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private verifyRefreshTokenUseCase: VerifyRefreshTokenUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies && (request.cookies['refresh_token'] as string),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: Jwt): Promise<UserResponse> {
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
