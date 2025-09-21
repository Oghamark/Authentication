import { RefreshToken } from 'src/domain/entities/refresh_token.entity';
import { Result } from 'src/core/result';

export interface IRefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<Result<void>>;
  findByTokenAndUserId(
    token: string,
    userId: string,
  ): Promise<Result<RefreshToken>>;
  revokeAllByUserId(userId: string): Promise<Result<void>>;
  revokeByTokenHash(tokenHash: string): Promise<Result<void>>;
  deleteExpiredTokens(): Promise<Result<void>>;
}
