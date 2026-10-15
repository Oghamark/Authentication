import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { UserController } from './user.controller';
import { RolesGuard } from 'src/infrastructure/guards/roles.guard';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';
import { ROLES_KEY } from 'src/infrastructure/decorators/roles.decorator';
import { Result } from 'src/core/result';

describe('UserController search route', () => {
  const searchUsersUseCase = {
    execute: jest.fn(),
  };
  const controller = new UserController(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    searchUsersUseCase as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('is an authenticated non-admin static GET route and precedes the id parameter route', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      UserController,
    ) as unknown[];

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Reflect.getMetadata(PATH_METADATA, controller.search)).toBe(
      'search',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Reflect.getMetadata(METHOD_METADATA, controller.search)).toBe(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Reflect.getMetadata(ROLES_KEY, controller.search)).toBeUndefined();
  });

  it('returns only candidate fields from the bounded search use case', async () => {
    searchUsersUseCase.execute.mockResolvedValue(
      Result.ok([
        {
          id: 'user-id',
          name: 'Alice Example',
          email: 'alice@example.com',
          password: 'secret',
          role: 'ADMIN',
          provider: 'oidc',
        },
      ]),
    );

    await expect(controller.search({ query: 'alice' })).resolves.toEqual({
      success: true,
      value: [
        {
          id: 'user-id',
          name: 'Alice Example',
          email: 'alice@example.com',
        },
      ],
    });
  });
});
