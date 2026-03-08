import { Inject, Injectable } from '@nestjs/common';
import { RegistrationDisabledException } from 'src/infrastructure/registration-disabled.exception';
import { IUseCase } from 'src/application/interfaces/use_case';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';
import {
  toUserPrincipal,
  UserPrincipal,
} from 'src/application/dtos/user/user_principal';
import { Result } from 'src/core/result';
import { UserFactory } from 'src/domain/entities/user.factory';

@Injectable()
export class OidcLoginUseCase implements IUseCase<
  UserPrincipal,
  UserPrincipal
> {
  constructor(
    @Inject('UserRepository')
    private userRepository: IUserRepository,
    @Inject('AuthConfigRepository')
    private authConfigRepository: IAuthConfigRepository,
  ) {}

  async execute(userPrincipal: UserPrincipal): Promise<Result<UserPrincipal>> {
    const findUserResult = await this.userRepository.findByEmail(
      userPrincipal.email,
    );

    if (findUserResult.isSuccess()) {
      return Result.ok(toUserPrincipal(findUserResult.value));
    }

    // User doesn't exist — check if registration is allowed before creating
    const authConfigResult = await this.authConfigRepository.get();
    if (
      authConfigResult.isFailure() ||
      !authConfigResult.value!.signupEnabled
    ) {
      // Registration is disabled — throw a typed exception that the controller
      // exception filter can map to a redirect or JSON response
      throw new RegistrationDisabledException('Registration is disabled');
    }

    const newUser = UserFactory.createPrincipal({
      name: userPrincipal.name,
      email: userPrincipal.email,
      role: userPrincipal.role,
    });

    const createUserResult = await this.userRepository.save(newUser);
    if (createUserResult.isFailure()) {
      return Result.fail(createUserResult.failure);
    }

    return Result.ok({
      ...newUser,
      id: createUserResult.value!,
    });
  }
}
