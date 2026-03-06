import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from 'src/application/interfaces/use_case';
import { UpdateUserRequest } from 'src/application/dtos/user/update_user_request';
import { Result } from 'src/core/result';

@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserRequest, User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({
    id,
    email,
    name,
    password,
    role,
  }: UpdateUserRequest): Promise<Result<User>> {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }

      const findUserResult = await this.userRepository.findById(id);
      if (findUserResult.isFailure()) {
        throw new UserNotFoundError(id);
      }

      const user = findUserResult.value!;

      user.email = email ?? user.email;
      user.name = name ?? user.name;
      user.password = password ?? user.password;
      if (role) user.role = role;

      await this.userRepository.update(user);
      return Result.ok(user);
    } catch (error) {
      throw new Error(`Error updating user: ${error}`);
    }
  }
}
