import { BadRequestException } from '@nestjs/common';
import { Result } from 'src/core/result';
import { SearchSocialAccountsUseCase } from './search_social_accounts';

describe('SearchSocialAccountsUseCase', () => {
  const repository = { searchSocialAccounts: jest.fn() };
  const useCase = new SearchSocialAccountsUseCase(repository as never);
  beforeEach(() => jest.clearAllMocks());

  it.each(['Alice', 'alice@example.com', 'alice@', 'a%_'])(
    'uses bounded social-only search for %s',
    async (query) => {
      repository.searchSocialAccounts.mockResolvedValue(Result.ok([]));
      await expect(
        useCase.execute({ query: ` ${query} ` }),
      ).resolves.toMatchObject({
        value: [],
      });
      expect(repository.searchSocialAccounts).toHaveBeenCalledWith(query, 20);
    },
  );

  it.each(['', ' ', 'a', 'x'.repeat(255), 'ab\n', ['alice'], undefined, null])(
    'rejects malformed or unbounded query %p before repository access',
    async (query) => {
      await expect(useCase.execute({ query } as never)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.searchSocialAccounts).not.toHaveBeenCalled();
    },
  );

  it('does not report repository outages as an empty match', async () => {
    repository.searchSocialAccounts.mockRejectedValue(
      new Error('database unavailable'),
    );
    await expect(useCase.execute({ query: 'Alice' })).rejects.toThrow(
      'database unavailable',
    );
  });
});
