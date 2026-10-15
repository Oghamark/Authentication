import { TypeOrmUserRepository } from './user_repository';

describe('TypeOrmUserRepository.search', () => {
  it('filters name or email case-insensitively in the database and bounds the query', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          name: 'Alice Example',
          email: 'alice@example.com',
          password: null,
          role: 'USER',
          provider: 'local',
        },
      ]),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const userRepository = new TypeOrmUserRepository(repository as never);

    const result = await userRepository.search('ALIce', 20);

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      "user.name ILIKE :query ESCAPE '\\'",
      { query: '%ALIce%' },
    );
    expect(queryBuilder.orWhere).toHaveBeenCalledWith(
      "user.email ILIKE :query ESCAPE '\\'",
      { query: '%ALIce%' },
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(result.value).toHaveLength(1);
  });

  it('escapes SQL wildcard characters in the search term', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const userRepository = new TypeOrmUserRepository(repository as never);

    await userRepository.search('A%_', 20);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      "user.name ILIKE :query ESCAPE '\\'",
      { query: '%A\\%\\_%' },
    );
    expect(queryBuilder.orWhere).toHaveBeenCalledWith(
      "user.email ILIKE :query ESCAPE '\\'",
      { query: '%A\\%\\_%' },
    );
  });
});
