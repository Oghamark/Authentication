import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user_repository';
import { UserNotFoundError } from 'src/domain/exceptions/user.exceptions';
import { IUseCase } from '../interfaces/use_case';
import { User } from '../../domain/entities/user.entity';
import { GetUserByIdRequest } from '../dtos/get_user_by_id_request';

@Injectable()
export class GetUserByIdUseCase implements IUseCase<GetUserByIdRequest, User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
  ) {}

  async execute({ id }: GetUserByIdRequest) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(id);
    if (!user.isSuccess) {
      throw new UserNotFoundError(id);
    }

    return user;
  }
}
