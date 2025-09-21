import { User } from 'src/domain/entities/user.entity';
import { IRepository } from './repository';
import { Result } from '../../core/result';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<Result<User>>;
  findByName(name: string): Promise<Result<User>>;
}
