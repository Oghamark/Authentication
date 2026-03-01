import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user_repository';
import { UserWithEmailNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from '../interfaces/use_case';
import { User } from '../../domain/entities/user.entity';
import { GetUserByEmailRequest } from '../dtos/get_user_by_email_request';
import { Result } from '../../core/result';

@Injectable()
export class GetUserByEmailUseCase
  implements IUseCase<GetUserByEmailRequest, User>
{
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
