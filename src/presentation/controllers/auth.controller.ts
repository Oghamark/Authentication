import {
  Controller,
  Request,
  Post,
  UseGuards,
  UnauthorizedException,
  Body,
  Res,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { LoginUseCase } from 'src/application/use_cases/auth/login';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';
import { CreateUserRequest } from 'src/application/dtos/user/create_user_request';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { toUserResponse } from 'src/application/dtos/user/user_response';
import { JwtRefreshAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';
import { Response } from 'express';
import { LogoutUseCase } from 'src/application/use_cases/auth/logout';
import { LocalAuthGuard } from 'src/infrastructure/guards/local_auth.guard';

@Controller()
export class AuthController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private loginUseCase: LoginUseCase,
    private getAuthConfigUseCase: GetAuthConfigUseCase,
    private logoutUseCase: LogoutUseCase,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.handleLogin(request, response);
  }

  @Post('sign-up')
  async signUp(@Body() body: CreateUserRequest) {
    const getAuthConfigResult = await this.getAuthConfigUseCase.execute();

    if (getAuthConfigResult.isFailure()) {
      throw new Error('Failed to retrieve auth configuration');
    }

    const authConfig = getAuthConfigResult.value!;

    if (!authConfig.signupEnabled) {
      throw new UnauthorizedException('Sign-up is currently disabled');
    }

    const createUserResult = await this.createUserUseCase.execute(body);

    if (createUserResult.isFailure()) {
      throw new Error('Failed to create user');
    }

    const user = toUserResponse(createUserResult.value!);

    const loginResult = await this.loginUseCase.execute({
      user,
    } as AuthenticatedRequest);

    if (loginResult.isFailure()) {
      throw new UnauthorizedException('User created but failed to log in');
    }
    const loginResponse = loginResult.value!;

    return { success: true, value: loginResponse };
  }

  /**
   * @deprecated
   * This endpoint is only kept for backward compatibility.
   * Use the /refresh/invalidate endpoint instead so that refresh tokens are revoked.
   */
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the refresh token cookie
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.handleLogin(request, response);
  }

  @Post('refresh/invalidate')
  async invalidateRefreshToken(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() body: { logoutAll?: boolean },
  ) {
    // revoke the refresh token
    const refreshToken = request.cookies['refresh_token'] as string | undefined;

    await this.logoutUseCase.execute({
      userId: request.user.id,
      refreshToken,
      logoutAll: body.logoutAll,
    });

    // Clear the refresh token cookie
    response.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/refresh',
      secure: process.env.NODE_ENV === 'production',
    });

    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return;
  }

  private async handleLogin(request: AuthenticatedRequest, response: Response) {
    const loginResult = await this.loginUseCase.execute(request);

    if (loginResult.isFailure()) {
      throw new InternalServerErrorException('Failed to generate tokens');
    }

    const { accessToken, refreshToken, userId, message } = loginResult.value!;

    // Set the new refresh token in an HttpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/refresh',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return { success: true, value: { userId, accessToken, message } };
  }
}
