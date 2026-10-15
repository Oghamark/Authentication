import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SearchUsersRequest } from 'src/application/dtos/user/search_users_request';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { IUseCase } from 'src/application/interfaces/use_case';
import { User } from 'src/domain/entities/user.entity';
import { Result } from 'src/core/result';

const MINIMUM_QUERY_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 20;

@Injectable()
export class SearchUsersUseCase implements IUseCase<
  SearchUsersRequest,
  User[]
> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute({ query }: SearchUsersRequest): Promise<Result<User[]>> {
    const trimmedQuery = query?.trim();

    if (!trimmedQuery || trimmedQuery.length < MINIMUM_QUERY_LENGTH) {
      throw new BadRequestException(
        `Search query must contain at least ${MINIMUM_QUERY_LENGTH} characters`,
      );
    }

    return this.userRepository.search(trimmedQuery, SEARCH_RESULT_LIMIT);
  }
}
