import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGateway } from 'src/application/interfaces/token_gateway';
import { JwtPayload } from 'src/domain/value_objects/jwt_payload';
import { instanceToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtTokenGateway implements ITokenGateway {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(instanceToPlain(payload), {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(instanceToPlain(payload), {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }
}
