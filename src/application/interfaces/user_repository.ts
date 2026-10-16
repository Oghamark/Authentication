import { User } from 'src/domain/entities/user.entity';
import { IRepository } from './repository';
import { Result } from 'src/core/result';
import { UserDisplayName } from 'src/application/dtos/user/get_display_names_request';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<Result<User>>;
  findByName(name: string): Promise<Result<User>>;
  search(query: string, limit: number): Promise<Result<User[]>>;
  searchSocialAccounts(
    query: string,
    limit: number,
  ): Promise<Result<UserDisplayName[]>>;
  findDisplayNames(userIds: string[]): Promise<Result<UserDisplayName[]>>;
}
