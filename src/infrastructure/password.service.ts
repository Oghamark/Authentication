import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { createHmac, randomBytes, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig, type JwtConfig } from './config';
import { UserEntity } from './database/entities/user.entity';
import { RefreshTokenEntity } from './database/entities/refresh_token.entity';

@Injectable()
export class PasswordService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY) private readonly config: JwtConfig,
  ) {}

  private key(purpose: string, secret: string | undefined): Buffer {
    if (!secret) throw new Error('Password recovery secret is not configured');
    return createHmac('sha256', secret).update(purpose).digest();
  }

  verifyRecoveryRequest(
    authorization: string | undefined,
    email: string,
  ): void {
    try {
      const token = authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new Error('Missing authorization');
      const payload = this.jwt.verify<{ purpose: string; email: string }>(
        token,
        {
          secret: this.key(
            'homebranch-password-recovery-request',
            this.config.jwtAccessSecret,
          ),
          algorithms: ['HS256'],
        },
      );
      if (
        payload.purpose !== 'password-recovery-request' ||
        payload.email !== email
      ) {
        throw new Error('Invalid authorization');
      }
    } catch {
      throw new UnauthorizedException();
    }
  }

  private fingerprint(password: string): string {
    return createHmac(
      'sha256',
      this.key('homebranch-password-fingerprint', this.config.jwtRefreshSecret),
    )
      .update(password)
      .digest('hex');
  }

  async createResetToken(email: string): Promise<string> {
    const user = await this.dataSource
      .getRepository(UserEntity)
      .findOne({ where: { email } });
    const eligible = user?.provider === 'LOCAL' && user.password;
    return this.jwt.sign(
      {
        purpose: 'password-reset',
        sub: eligible ? user.id : randomUUID(),
        fingerprint: eligible
          ? this.fingerprint(user.password!)
          : randomBytes(32).toString('hex'),
      },
      {
        secret: this.key(
          'homebranch-password-reset',
          this.config.jwtRefreshSecret,
        ),
        algorithm: 'HS256',
        expiresIn: '30m',
      },
    );
  }

  async reset(token: string, newPassword: string): Promise<void> {
    this.validatePassword(newPassword);
    let payload: { purpose: string; sub: string; fingerprint: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.key(
          'homebranch-password-reset',
          this.config.jwtRefreshSecret,
        ),
        algorithms: ['HS256'],
      });
      if (
        payload.purpose !== 'password-reset' ||
        typeof payload.sub !== 'string' ||
        typeof payload.fingerprint !== 'string'
      ) {
        throw new Error('Invalid token');
      }
    } catch {
      throw new BadRequestException('Invalid or expired reset link');
    }
    await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const user = await users.findOne({
        where: { id: payload.sub },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !user ||
        user.provider !== 'LOCAL' ||
        !user.password ||
        this.fingerprint(user.password) !== payload.fingerprint
      ) {
        throw new BadRequestException('Invalid or expired reset link');
      }
      user.password = await hash(newPassword, 10);
      await users.save(user);
      await manager
        .getRepository(RefreshTokenEntity)
        .delete({ userId: user.id });
    });
  }

  private validatePassword(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must be at most 72 bytes');
    }
  }

  async change(userId: string, currentPassword: string, newPassword: string) {
    this.validatePassword(newPassword);

    await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const user = await users.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !user ||
        user.provider !== 'LOCAL' ||
        !user.password ||
        !(await compare(currentPassword, user.password))
      ) {
        throw new BadRequestException('Current password is incorrect');
      }

      user.password = await hash(newPassword, 10);
      await users.save(user);
      await manager.getRepository(RefreshTokenEntity).delete({ userId });
    });
  }
}
