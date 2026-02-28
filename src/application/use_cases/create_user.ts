import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from '../interfaces/user_repository';
import { UserFactory } from 'src/domain/entities/user.factory';
import { IUseCase } from '../interfaces/use_case';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ICryptoGateway } from '../interfaces/crypto_gateway';
import { UserAlreadyExistsError } from 'src/domain/exceptions/user.exceptions';
import { CreateUserRequest } from '../dtos/create_user_request';
import {
  PasswordsDontMatchException,
  SignupDisabledError,
} from '../../domain/exceptions/auth.exceptions';
import { IAppConfigRepository } from '../interfaces/app_config_repository';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserRequest, User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,

    @Inject('CryptoGateway')
    private cryptoGateway: ICryptoGateway,

    @Inject('AppConfigRepository')
    private appConfigRepository: IAppConfigRepository,
  ) {}

  async execute(input: CreateUserRequest): Promise<User> {
    const { name, email, password, password_confirmation } = input;

    const config = await this.appConfigRepository.getConfig();
    if (!config.signupEnabled) {
      throw new SignupDisabledError();
    }

    if (password !== password_confirmation) {
      throw new PasswordsDontMatchException();
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      Logger.error(`User with email ${email} already exists.`);
      throw new UserAlreadyExistsError(email);
    }

    // Hash the password
    const hashedPassword = await this.cryptoGateway.hash(password);

    // Create user entity
    const user = UserFactory.create({ name, email, password: hashedPassword });

    // Save user to repository
    await this.userRepository.save(user);

    return user;
  }
}

