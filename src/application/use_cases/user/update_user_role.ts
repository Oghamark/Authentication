import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { Inject, Injectable } from '@nestjs/common';
import {
  CannotModifyOwnRoleError,
  UserNotFoundError,
} from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from 'src/application/interfaces/use_case';
import { UpdateUserRoleRequest } from 'src/application/dtos/user/update_user_role_request';
import { Result } from 'src/core/result';

@Injectable()
export class UpdateUserRoleUseCase implements IUseCase<
  UpdateUserRoleRequest,
  User
> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({
    id,
    authenticatedUserId,
    role,
  }: UpdateUserRoleRequest): Promise<Result<User>> {
    try {
      if (id === authenticatedUserId) {
        throw new CannotModifyOwnRoleError();
      }

      const findUserResult = await this.userRepository.findById(id);
      if (findUserResult.isFailure()) {
        throw new UserNotFoundError(id);
      }

      const user = findUserResult.value!;
      user.role = role;

      await this.userRepository.update(user);
      return Result.ok(user);
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
