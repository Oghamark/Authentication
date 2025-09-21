import { Inject } from '@nestjs/common';
import { IUseCase } from '../interfaces/use_case';
import { IUserRepository } from '../interfaces/user_repository';
import { UserWithEmailNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { DeleteUserByEmailRequest } from '../dtos/delete_user_by_email_request';
import { Result } from '../../core/result';

export class DeleteUserByEmailUseCase
  implements IUseCase<DeleteUserByEmailRequest, void>
{
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({ email }: DeleteUserByEmailRequest): Promise<Result<void>> {
    const findUserResult = await this.userRepository.findByEmail(email);

    const user = findUserResult.on({
      failure: () => {
        throw new UserWithEmailNotFoundError(email);
      },
      success: (user) => user,
    });

    return await this.userRepository.delete(user.id);
  }
}
