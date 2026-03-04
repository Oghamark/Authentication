import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from '../interfaces/user_repository';
import { UserFactory } from 'src/domain/entities/user.factory';
import { IUseCase } from '../interfaces/use_case';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ICryptoGateway } from '../interfaces/crypto_gateway';
import { UserAlreadyExistsError } from 'src/domain/exceptions/user.exceptions';
import { CreateUserRequest } from '../dtos/create_user_request';
import { PasswordsDontMatchException } from '../../domain/exceptions/auth.exceptions';
import { Result } from '../../core/result';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserRequest, User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,

    @Inject('CryptoGateway')
    private cryptoGateway: ICryptoGateway,
  ) {}

  async execute(input: CreateUserRequest): Promise<Result<User>> {
    const { name, email, password, password_confirmation } = input;

    if (password !== password_confirmation) {
      throw new PasswordsDontMatchException();
    }

    // Check if user already exists
    const existingUserResult = await this.userRepository.findByEmail(email);
    if (existingUserResult.isSuccess()) {
      Logger.error(`User with email ${email} already exists.`);
      throw new UserAlreadyExistsError(email);
    }

    // Hash the password
    const hashedPassword = await this.cryptoGateway.hash(password);

    // First user becomes ADMIN
    const countResult = await this.userRepository.count();
    const isFirstUser = !countResult.isFailure() && countResult.value === 0;
    const role = isFirstUser ? 'ADMIN' : 'USER';

    // Create user entity
    const user = UserFactory.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Save user to repository
    const saveResult = await this.userRepository.save(user);

    if (saveResult.isFailure()) {
      return Result.fail(saveResult.failure);
    }
    return Result.ok(user);
  }
}

