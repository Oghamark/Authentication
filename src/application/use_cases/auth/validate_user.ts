import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/application/interfaces/use_case';
import {
  toUserPrincipal,
  UserPrincipal,
} from 'src/application/dtos/user/user_principal';
import { LoginRequest } from 'src/application/dtos/auth/login_request';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { ICryptoGateway } from 'src/application/interfaces/crypto_gateway';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';

@Injectable()
export class ValidateUserUseCase implements IUseCase<
  LoginRequest,
  UserPrincipal
> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('CryptoGateway')
    private readonly cryptoGateway: ICryptoGateway,
  ) {}

  async execute({
    email,
    password,
  }: LoginRequest): Promise<Result<UserPrincipal>> {
    const userResult = await this.userRepository.findByEmail(email);

    if (userResult.isFailure()) {
      return Result.fail(userResult.failure);
    }

    const user = userResult.value!;

    if (!user.password) {
      return Result.fail(new GenericFailure('Invalid email or password'));
    }

    const isValid = await this.cryptoGateway.validate(password, user.password);

    if (!isValid) {
      return Result.fail(new GenericFailure('Invalid email or password'));
    }

    const userResponse = toUserPrincipal(user);

    return Result.ok(userResponse);
  }
}
