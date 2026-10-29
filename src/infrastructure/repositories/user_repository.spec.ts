import { TypeOrmUserRepository } from './user_repository';
import { In } from 'typeorm';

describe('TypeOrmUserRepository.search', () => {
  it.each(['Alice', 'alice@example.com', 'alice@', 'a%_\\'])(
    'social search only matches literal names or an exact email: %s',
    async (query) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'id', name: 'Alice', email: 'private', password: 'private' },
          ]),
      };
      const repository = {
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      };
      const result = await new TypeOrmUserRepository(
        repository as never,
      ).searchSocialAccounts(query, 100);
      expect(builder.select).toHaveBeenCalledWith(['user.id', 'user.name']);
      expect(builder.where).toHaveBeenCalledWith(
        "user.name ILIKE :name ESCAPE '\\'",
        {
          name: `%${query.replace(/[\\%_]/g, '\\$&')}%`,
        },
      );
      expect(builder.orWhere).toHaveBeenCalledWith(
        'LOWER(user.email) = LOWER(:email)',
        {
          email: query,
        },
      );
      expect(builder.take).toHaveBeenCalledWith(20);
      expect(result.value).toEqual([{ id: 'id', name: 'Alice' }]);
    },
  );
  it('selects only bounded display-name columns and never maps a full profile', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'user-id',
          name: 'Alice',
          email: 'private',
          password: 'secret',
        },
      ]),
    };
    const userRepository = new TypeOrmUserRepository(repository as never);
    const result = await userRepository.findDisplayNames(['user-id']);
    expect(repository.find).toHaveBeenCalledWith({
      select: { id: true, name: true },
      where: {
        id: In(['user-id']),
      },
      take: 50,
    });
    expect(result.value).toEqual([{ id: 'user-id', name: 'Alice' }]);
  });

  it('does not issue a database query for an empty display-name batch', async () => {
    const repository = { find: jest.fn() };
    const userRepository = new TypeOrmUserRepository(repository as never);
    await expect(userRepository.findDisplayNames([])).resolves.toMatchObject({
      value: [],
    });
    expect(repository.find).not.toHaveBeenCalled();
  });
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
