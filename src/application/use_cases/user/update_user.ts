import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUseCase } from 'src/application/interfaces/use_case';
import { UpdateUserRequest } from 'src/application/dtos/user/update_user_request';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';

@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserRequest, User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  private readonly logger = new Logger('UpdateUserUseCase');

  async execute({
    id,
    email,
    name,
    password,
    role,
  }: UpdateUserRequest): Promise<Result<User>> {
    try {
      if (!id) {
        return Result.fail(new GenericFailure('User ID is required'));
      }

      const findUserResult = await this.userRepository.findById(id);
      if (findUserResult.isFailure()) {
        return Result.fail(new GenericFailure('User not found'));
      }

      const user = findUserResult.value!;

      user.email = email ?? user.email;
      user.name = name ?? user.name;
      user.password = password ?? user.password;
      user.role = role ?? user.role;

      await this.userRepository.update(user);
      return Result.ok(user);
    } catch (error) {
      this.logger.error(
        `Failed to update user with ID ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      return Result.fail(new GenericFailure('Failed to update user'));
    }
  }
}
