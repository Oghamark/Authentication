import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/application/interfaces/use_case';
import { LoginResponse } from 'src/application/dtos/auth/login_response';
import { Result } from 'src/core/result';
import { ITokenGateway } from 'src/application/interfaces/token_gateway';
import { IRefreshTokenRepository } from 'src/application/interfaces/refresh_token_repository';
import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { JwtPayload } from 'src/domain/value_objects/jwt_payload';
import { RefreshToken } from 'src/domain/entities/refresh_token.entity';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';
import { jwtConfig, type JwtConfig } from 'src/infrastructure/config';

@Injectable()
export class LoginUseCase implements IUseCase<
  AuthenticatedRequest,
  LoginResponse
> {
  constructor(
    @Inject('TokenGateway') private readonly tokenGateway: ITokenGateway,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('CryptoGateway') private readonly cryptoGateway: ICryptoGateway,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: JwtConfig,
  ) {}

  async execute({
    user,
  }: AuthenticatedRequest): Promise<Result<LoginResponse>> {
    // The local strategy should have already authenticated the user and attached the user object to the request
    // No need to check the password here, just generate the tokens
    const payload = JwtPayload.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const accessToken = this.tokenGateway.generateAccessToken(payload);
    const refreshToken = this.tokenGateway.generateRefreshToken(payload);

    const tokenHash = await this.cryptoGateway.hash(refreshToken);
    const refreshTokenEntity = RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt: this.computeRefreshTokenExpiry(),
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    const loginResponse: LoginResponse = {
      accessToken,
      refreshToken,
      userId: user.id,
      message: 'Login successful',
    };

    const result = Result.ok(loginResponse);

    return Promise.resolve(result);
  }

  private computeRefreshTokenExpiry(): Date {
    return new Date(
      Date.now() +
        this.parseDurationToMs(this.jwtConfiguration.jwtRefreshExpiration),
    );
  }

  private parseDurationToMs(duration: string): number {
    const asNumber = Number(duration);
    if (!isNaN(asNumber)) return asNumber * 1000;
    const units: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const match = duration.match(/^(\d+)([smhd])$/);
    return match ? parseInt(match[1]) * units[match[2]] : 7 * 86_400_000;
  }
}
