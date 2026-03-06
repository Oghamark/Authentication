import { Inject } from '@nestjs/common';
import { IUseCase } from 'src/application/interfaces/use_case';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { UserWithEmailNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { DeleteUserByEmailRequest } from 'src/application/dtos/user/delete_user_by_email_request';
import { Result } from 'src/core/result';

export class DeleteUserByEmailUseCase implements IUseCase<
  DeleteUserByEmailRequest,
  void
> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({ email }: DeleteUserByEmailRequest): Promise<Result> {
    const findUserResult = await this.userRepository.findByEmail(email);

    if (findUserResult.isFailure()) {
      throw new UserWithEmailNotFoundError(email);
    }

    return await this.userRepository.delete(findUserResult.value!.id);
  }
}
