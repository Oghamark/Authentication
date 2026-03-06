import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateUserUseCase } from 'src/application/use_cases/auth/validate_user';
import { UserResponse } from 'src/application/dtos/user/user_response';
import { InvalidCredentialsError } from 'src/domain/exceptions/auth.exceptions';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private validateUserUseCase: ValidateUserUseCase) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(username: string, password: string): Promise<UserResponse> {
    const validateUserResult = await this.validateUserUseCase.execute({
      email: username,
      password,
    });

    if (validateUserResult.isFailure()) {
      throw new InvalidCredentialsError();
    }

    return validateUserResult.value!;
  }
}
