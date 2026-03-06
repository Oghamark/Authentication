import { IUseCase } from 'src/application/interfaces/use_case';
import { LogoutRequest } from 'src/application/dtos/auth/logout_request';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IRefreshTokenRepository } from 'src/application/interfaces/refresh_token_repository';
import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';

@Injectable()
export class LogoutUseCase implements IUseCase<LogoutRequest, void> {
  constructor(
    @Inject('CryptoGateway')
    private cryptoGateway: ICryptoGateway,
    @Inject('RefreshTokenRepository')
    private refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  private readonly logger = new Logger('LogoutUseCase');

  async execute({
    userId,
    refreshToken,
    logoutAll,
  }: LogoutRequest): Promise<Result> {
    if (logoutAll && userId) {
      // Revoke all refresh tokens for the user
      const revokeAllResult =
        await this.refreshTokenRepository.revokeAllByUserId(userId);
      if (revokeAllResult.isFailure()) {
        this.logger.warn('Failed to revoke all refresh tokens for user', {
          userId,
          error: revokeAllResult.failure,
        });
        return Result.fail(
          new GenericFailure('Failed to revoke all refresh tokens for user'),
        );
      }
      return Result.ok();
    }

    if (!refreshToken || !userId) {
      this.logger.warn('Missing refresh token or user ID for logout', {
        userId,
        refreshToken,
      });
      return Result.fail(
        new GenericFailure('Missing refresh token or user ID for logout'),
      );
    }

    const findTokenResult =
      await this.refreshTokenRepository.findByTokenAndUserId(
        refreshToken,
        userId,
      );

    if (findTokenResult.isFailure()) {
      this.logger.warn('Refresh token not found for logout', {
        userId,
        refreshToken,
        error: findTokenResult.failure,
      });
      return Result.fail(
        new GenericFailure('Refresh token not found for logout'),
      );
    }

    const revokeResult = await this.refreshTokenRepository.revokeByTokenHash(
      findTokenResult.value!.tokenHash,
    );

    if (revokeResult.isFailure()) {
      this.logger.warn('Failed to revoke refresh token for logout', {
        userId,
        refreshToken,
        error: revokeResult.failure,
      });

      return Result.fail(
        new GenericFailure('Refresh token not found for logout'),
      );
    }

    return Result.ok();
  }
}
