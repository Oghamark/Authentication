import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHmac } from 'crypto';
import { PasswordService } from './password.service';
import { UserEntity } from './database/entities/user.entity';

describe('PasswordService', () => {
  let user: UserEntity;
  let service: PasswordService;
  let deleteRefreshTokens: jest.Mock;
  const config = {
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
  };

  beforeEach(async () => {
    user = {
      id: 'd7112445-a1e6-424e-95b1-c0d5af5de946',
      name: 'Reader',
      email: 'reader@example.test',
      password: await hash('old-password', 4),
      provider: 'LOCAL',
      role: 'USER',
    };
    deleteRefreshTokens = jest.fn().mockResolvedValue({});
    const users = {
      findOne: jest.fn(
        ({ where }: { where: { id?: string; email?: string } }) =>
          Promise.resolve(
            where.id === user.id || where.email === user.email
              ? { ...user }
              : null,
          ),
      ),
      save: jest.fn((updated: UserEntity) => {
        user = updated;
        return Promise.resolve();
      }),
    };
    const refresh = { delete: deleteRefreshTokens };
    const manager = {
      getRepository: (entity: unknown) =>
        entity === UserEntity ? users : refresh,
    };
    const dataSource = {
      getRepository: (entity: unknown) =>
        entity === UserEntity ? users : refresh,
      transaction: async (fn: (value: typeof manager) => Promise<void>) =>
        fn(manager),
    };
    service = new PasswordService(
      dataSource as never,
      new JwtService(),
      config as never,
    );
  });

  it('requires the current password and revokes refresh tokens after changing it', async () => {
    await expect(
      service.change(user.id, 'wrong', 'new-password'),
    ).rejects.toThrow();
    expect(deleteRefreshTokens).not.toHaveBeenCalled();
    await service.change(user.id, 'old-password', 'new-password');
    expect(await compare('new-password', user.password!)).toBe(true);
    expect(deleteRefreshTokens).toHaveBeenCalledWith({ userId: user.id });
  });

  it('accepts a reset token once, invalidates other tokens, and revokes sessions', async () => {
    const token = await service.createResetToken(user.email);
    const other = await service.createResetToken(user.email);
    expect(token).not.toContain('old-password');
    await service.reset(token, 'new-password');
    expect(await compare('new-password', user.password!)).toBe(true);
    expect(deleteRefreshTokens).toHaveBeenCalledWith({ userId: user.id });
    await expect(service.reset(token, 'another-password')).rejects.toThrow();
    await expect(service.reset(other, 'another-password')).rejects.toThrow();
  });

  it('invalidates reset links after a password change', async () => {
    const token = await service.createResetToken(user.email);
    await service.change(user.id, 'old-password', 'new-password');
    await expect(service.reset(token, 'another-password')).rejects.toThrow();
  });

  it('rejects reset tokens for nonexistent and externally managed accounts', async () => {
    const unknown = await service.createResetToken('unknown@example.test');
    await expect(service.reset(unknown, 'new-password')).rejects.toThrow();
    user.provider = 'OIDC';
    const external = await service.createResetToken(user.email);
    await expect(service.reset(external, 'new-password')).rejects.toThrow();
    await expect(
      service.change(user.id, 'old-password', 'new-password'),
    ).rejects.toThrow();
  });

  it('rejects tampered, expired and oversized inputs', async () => {
    const token = await service.createResetToken(user.email);
    await expect(service.reset(`${token}x`, 'new-password')).rejects.toThrow();
    await expect(service.reset(token, 'é'.repeat(37))).rejects.toThrow();
    jest.useFakeTimers().setSystemTime(Date.now() + 31 * 60 * 1000);
    try {
      await expect(service.reset(token, 'new-password')).rejects.toThrow();
    } finally {
      jest.useRealTimers();
    }
  });

  it('requires an internal credential bound to the requested email', () => {
    const secret = createHmac('sha256', config.jwtAccessSecret)
      .update('homebranch-password-recovery-request')
      .digest();
    const token = new JwtService().sign(
      { purpose: 'password-recovery-request', email: user.email },
      { secret, expiresIn: '1m' },
    );
    expect(() =>
      service.verifyRecoveryRequest(`Bearer ${token}`, user.email),
    ).not.toThrow();
    expect(() =>
      service.verifyRecoveryRequest(`Bearer ${token}`, 'other@example.test'),
    ).toThrow();
    expect(() =>
      service.verifyRecoveryRequest(undefined, user.email),
    ).toThrow();
  });
});
