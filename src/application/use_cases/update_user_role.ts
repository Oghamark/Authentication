import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from '../interfaces/user_repository';
import { Inject, Injectable } from '@nestjs/common';
import {
  CannotModifyOwnRoleError,
  UserNotFoundError,
} from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from '../interfaces/use_case';
import { UpdateUserRoleRequest } from '../dtos/update_user_role_request';

@Injectable()
export class UpdateUserRoleUseCase
  implements IUseCase<UpdateUserRoleRequest, User>
{
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({
    id,
    authenticatedUserId,
    role,
  }: UpdateUserRoleRequest): Promise<User> {
    try {
      if (id === authenticatedUserId) {
        throw new CannotModifyOwnRoleError();
      }

      const user: User | null = await this.userRepository.findById(id);
      if (!user) {
        throw new UserNotFoundError(id);
      }

      user.role = role;

      await this.userRepository.update(user);
      return user;
    } catch (error) {
      if (
        error instanceof CannotModifyOwnRoleError ||
        error instanceof UserNotFoundError
      ) {
        throw error;
      }
      throw new Error(`Error updating user role: ${error}`);
    }
  }
}
