import { AuthController } from './auth.controller';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';

describe('password change and refresh rotation', () => {
  it('does not return a newly issued token when the old refresh token was revoked', async () => {
    const login = {
      execute: jest.fn().mockResolvedValue(
        Result.ok({
          accessToken: 'access',
          refreshToken: 'new-refresh',
          userId: 'user-id',
        }),
      ),
    };
    const logout = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(
          Result.fail(new GenericFailure('Token not found')),
        )
        .mockResolvedValueOnce(Result.ok()),
    };
    const controller = new AuthController(
      {} as never,
      {} as never,
      login as never,
      {} as never,
      logout as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const response = { cookie: jest.fn() };
    await expect(
      controller.refresh(
        { user: { id: 'user-id' } } as never,
        'old-refresh',
        response as never,
      ),
    ).rejects.toThrow('Invalid or expired refresh token');
    expect(logout.execute).toHaveBeenNthCalledWith(1, {
      userId: 'user-id',
      refreshToken: 'old-refresh',
    });
    expect(logout.execute).toHaveBeenNthCalledWith(2, {
      userId: 'user-id',
      refreshToken: 'new-refresh',
    });
    expect(response.cookie).not.toHaveBeenCalled();
  });
});
