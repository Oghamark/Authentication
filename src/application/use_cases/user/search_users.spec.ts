import { BadRequestException } from '@nestjs/common';
import { SearchUsersUseCase } from './search_users';
import { Result } from 'src/core/result';
import { User } from 'src/domain/entities/user.entity';

describe('SearchUsersUseCase', () => {
  const users = [
    new User('1', 'Alice Example', 'alice@example.com', null, 'ADMIN', 'local'),
  ];
  const userRepository = {
    search: jest.fn(),
  };
  const useCase = new SearchUsersUseCase(userRepository as never);

  beforeEach(() => jest.clearAllMocks());

  it('trims a valid query and requests no more than twenty matching users', async () => {
    userRepository.search.mockResolvedValue(Result.ok(users));

    const result = await useCase.execute({ query: '  ALIce  ' });

    expect(userRepository.search).toHaveBeenCalledWith('ALIce', 20);
    expect(result.value).toEqual(users);
  });

  it.each(['', ' ', 'a', ' a '])(
    'rejects a query shorter than two trimmed characters: %p',
    async (query) => {
      await expect(useCase.execute({ query })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userRepository.search).not.toHaveBeenCalled();
    },
  );
});
