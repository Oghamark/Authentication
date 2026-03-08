import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGateway } from 'src/application/interfaces/token_gateway';
import { JwtPayload } from 'src/domain/value_objects/jwt_payload';
import { instanceToPlain } from 'class-transformer';
import { type JwtConfig, jwtConfig } from 'src/infrastructure/config';

@Injectable()
export class JwtTokenGateway implements ITokenGateway {
  constructor(
    @Inject(jwtConfig.KEY) private config: JwtConfig,
    private readonly jwtService: JwtService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(instanceToPlain(payload), {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiration,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(instanceToPlain(payload), {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiration,
    });
  }
}
