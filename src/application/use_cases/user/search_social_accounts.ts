import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { SearchUsersRequest } from 'src/application/dtos/user/search_users_request';
import { UserDisplayName } from 'src/application/dtos/user/get_display_names_request';
import { Result } from 'src/core/result';

@Injectable()
export class SearchSocialAccountsUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute({
    query,
  }: SearchUsersRequest): Promise<Result<UserDisplayName[]>> {
    if (
      typeof query !== 'string' ||
      query.trim().length < 2 ||
      query.trim().length > 254 ||
      /\p{Cc}/u.test(query)
    ) {
      throw new BadRequestException(
        'Search query must contain 2 to 254 characters',
      );
    }
    return this.userRepository.searchSocialAccounts(query.trim(), 20);
  }
}
