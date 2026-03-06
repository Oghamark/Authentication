import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/application/interfaces/use_case';
import { LoginResponse } from 'src/application/dtos/auth/login_response';
import { Result } from 'src/core/result';
import { ITokenGateway } from 'src/application/interfaces/token_gateway';
import { JwtPayload } from 'src/domain/value_objects/jwt_payload';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';

@Injectable()
export class LoginUseCase implements IUseCase<
  AuthenticatedRequest,
  LoginResponse
> {
  constructor(
    @Inject('TokenGateway') private readonly tokenGateway: ITokenGateway,
  ) {}

  async execute({
    user,
  }: AuthenticatedRequest): Promise<Result<LoginResponse>> {
    // The local strategy should have already authenticated the user and attached the user object to the request
    // No need to check the password here, just generate the tokens
    const payload = JwtPayload.create({
      userId: user.id,
      email: user.email,
      roles: [user.role],
    });

    const accessToken = this.tokenGateway.generateAccessToken(payload);
    const refreshToken = this.tokenGateway.generateRefreshToken(payload);

    const loginResponse: LoginResponse = {
      accessToken,
      refreshToken,
      userId: user.id,
      message: 'Login successful',
    };

    const result = Result.ok(loginResponse);

    return Promise.resolve(result);
  }
}
