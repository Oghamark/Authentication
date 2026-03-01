import { Inject, Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from 'src/application/interfaces/refresh_token_repository';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../database/entities/refresh_token.entity';
import { RefreshToken } from 'src/domain/entities/refresh_token.entity';
import { RefreshTokenMapper } from '../mappers/refresh_token.mapper';
import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { Result } from '../../core/result';
import { GenericFailure } from '../../core/failure';

@Injectable()
export class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>,
    @Inject('CryptoGateway')
    private readonly cryptoGateway: ICryptoGateway, // Inject crypto for verification
  ) {}

  async findByTokenAndUserId(
    token: string,
    userId: string,
  ): Promise<Result<RefreshToken>> {
    // 1. Get all active tokens for this user
    const entities = await this.repository.find({
      where: {
        userId,
        expiresAt: MoreThan(new Date()),
      },
    });

    // 2. Verify the provided token against each stored hash
    for (const entity of entities) {
      const isMatch = await this.cryptoGateway.validate(
        token,
        entity.tokenHash,
      );
      if (isMatch) {
        return Result.ok(RefreshTokenMapper.toDomain(entity));
      }
    }

    return Result.fail(new GenericFailure('Token not found'));
  }

  async save(refreshToken: RefreshToken): Promise<Result<void>> {
    const entity = RefreshTokenMapper.toPersistence(refreshToken);
    await this.repository.save(entity);
    return Result.ok();
  }
  async revokeByTokenHash(tokenHash: string): Promise<Result<void>> {
    await this.repository.delete({ tokenHash: tokenHash });
    return Result.ok();
  }

  async revokeAllByUserId(userId: string): Promise<Result<void>> {
    await this.repository.delete({ userId });
    return Result.ok();
  }

  async deleteExpiredTokens(): Promise<Result<void>> {
    await this.repository.delete({ expiresAt: LessThan(new Date()) });
    return Result.ok();
  }
}
