import { BadRequestException } from '@nestjs/common';
import { GetDisplayNamesUseCase } from './get_display_names';
import { Result } from 'src/core/result';
import { UserNotFoundFailure } from 'src/domain/failures/user_failures';

describe('GetDisplayNamesUseCase', () => {
  const id = '123e4567-e89b-42d3-a456-426614174001';
  const repository = { findDisplayNames: jest.fn() };
  const useCase = new GetDisplayNamesUseCase(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('deduplicates UUIDs and returns the repository Result', async () => {
    const result = Result.ok([{ id, name: 'Alice' }]);
    repository.findDisplayNames.mockResolvedValue(result);
    await expect(
      useCase.execute({ userIds: [id, id.toUpperCase()] }),
    ).resolves.toBe(result);
    expect(repository.findDisplayNames).toHaveBeenCalledWith([id]);
  });

  it('keeps a repository failure distinct from a confirmed missing user', async () => {
    const result = Result.fail(new UserNotFoundFailure());
    repository.findDisplayNames.mockResolvedValue(result);
    await expect(useCase.execute({ userIds: [id] })).resolves.toBe(result);
  });

  it.each([
    null,
    undefined,
    'not-an-array',
    ['bad-id'],
    [null],
    Array(51).fill(id),
  ])('rejects malformed or over-limit IDs: %p', async (userIds) => {
    await expect(useCase.execute({ userIds } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findDisplayNames).not.toHaveBeenCalled();
  });

  it('accepts an empty batch', async () => {
    repository.findDisplayNames.mockResolvedValue(Result.ok([]));
    await expect(useCase.execute({ userIds: [] })).resolves.toMatchObject({
      success: true,
      value: [],
    });
  });
});
