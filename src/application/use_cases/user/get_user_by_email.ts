import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { UserWithEmailNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from 'src/application/interfaces/use_case';
import { User } from 'src/domain/entities/user.entity';
import { GetUserByEmailRequest } from 'src/application/dtos/user/get_user_by_email_request';
import { Result } from 'src/core/result';

@Injectable()
export class GetUserByEmailUseCase implements IUseCase<
  GetUserByEmailRequest,
  User
> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute(input: GetUserByEmailRequest) {
    const findUserResult = await this.userRepository.findByEmail(input.email);

    if (findUserResult.isFailure()) {
      throw new UserWithEmailNotFoundError(input.email);
    }

    return Result.ok(findUserResult.value);
  }
}
