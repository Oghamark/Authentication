import { IUseCase } from 'src/application/interfaces/use_case';
import { Result } from 'src/core/result';
import { VerifyRefreshTokenRequest } from 'src/application/dtos/auth/verify_refresh_token_request';
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { IRefreshTokenRepository } from 'src/application/interfaces/refresh_token_repository';
import { GenericFailure } from 'src/core/failure';
import {
  toUserResponse,
  UserResponse,
} from 'src/application/dtos/user/user_response';

@Injectable()
export class VerifyRefreshTokenUseCase implements IUseCase<
  VerifyRefreshTokenRequest,
  UserResponse
> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
    @Inject('RefreshTokenRepository')
    private refreshTokenRepository: IRefreshTokenRepository,
    @Inject('CryptoGateway')
    private cryptoGateway: ICryptoGateway,
  ) {}

  async execute({
    refreshToken,
    userId,
  }: VerifyRefreshTokenRequest): Promise<Result<UserResponse>> {
    // Validate user exists
    const findUserResult = await this.userRepository.findById(userId);

    if (findUserResult.isFailure()) {
      return Result.fail(findUserResult.failure);
    }

    // Verify refresh token
    const findTokenResult =
      await this.refreshTokenRepository.findByTokenAndUserId(
        refreshToken,
        userId,
      );

    if (findTokenResult.isFailure()) {
      return Result.fail(findTokenResult.failure);
    }

    const storedToken = findTokenResult.value!;

    const isValid = await this.cryptoGateway.validate(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!isValid) {
      return Result.fail(new GenericFailure('Invalid refresh token'));
    }

    const userResponse = toUserResponse(findUserResult.value!);

    return Result.ok(userResponse);
  }
}
