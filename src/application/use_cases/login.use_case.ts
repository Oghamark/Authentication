import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../interfaces/use_case';
import { LoginRequest } from '../dtos/login_request';
import { LoginResponse } from '../dtos/login_response';
import { IUserRepository } from '../interfaces/user_repository';
import { IRefreshTokenRepository } from '../interfaces/refresh_token_repository';
import { ICryptoGateway } from '../interfaces/crypto_gateway';
import { ITokenGateway } from '../interfaces/token_gateway';
import { InvalidCredentialsError } from 'src/domain/exceptions/auth.exceptions';
import { JwtPayload } from 'src/domain/value_objects/jwt_payload';
import { RefreshToken } from 'src/domain/entities/refresh_token.entity';
import { Result } from '../../core/result';

@Injectable()
export class LoginUseCase implements IUseCase<LoginRequest, LoginResponse> {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('CryptoGateway') private readonly cryptoGateway: ICryptoGateway,
    @Inject('TokenGateway') private readonly tokenGateway: ITokenGateway,
  ) {}

  async execute(request: LoginRequest): Promise<Result<LoginResponse>> {
    // 1. Find and verify user
    const findUserResult = await this.userRepository.findByEmail(request.email);
    if (!findUserResult.isSuccess) {
      throw new InvalidCredentialsError();
    }

    const user = findUserResult.value!;

    // 2. Verify password
    const isPasswordValid = await this.cryptoGateway.validate(
      request.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 4. Generate access token
    const jwtPayload = JwtPayload.create({
      userId: user.id,
      email: user.email,
      roles: [user.role],
    });

    const accessToken = await this.tokenGateway.generateAccessToken(jwtPayload);

    // 5. Generate refresh token (only if remember me or long-term access needed)
    // if (request.rememberMe) {
    // TODO: implement rememberMe
    const refreshTokenData = await this.tokenGateway.generateRefreshToken(
      user.id,
    );
    const refreshTokenValue = refreshTokenData.token;
    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: refreshTokenData.tokenHash,
      expiresAt: refreshTokenData.expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return Result.success({
      accessToken,
      refreshToken: refreshTokenValue,
      expiresAt: jwtPayload.expiresAt,
      userId: user.id,
    });
  }
}
