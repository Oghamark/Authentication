import { RefreshToken } from 'src/domain/entities/refresh_token.entity';
import { Result } from 'src/core/result';

export interface IRefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<Result>;
  findByTokenAndUserId(
    token: string,
    userId: string,
  ): Promise<Result<RefreshToken>>;
  revokeAllByUserId(userId: string): Promise<Result>;
  revokeByTokenHash(tokenHash: string): Promise<Result>;
  deleteExpiredTokens(): Promise<Result>;
}
