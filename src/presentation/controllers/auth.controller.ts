import {
  Controller,
  Request,
  Post,
  UnauthorizedException,
  BadRequestException,
  Body,
  Res,
  InternalServerErrorException,
  Req,
  UseGuards,
  Get,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { OidcExceptionFilter } from 'src/infrastructure/filters/oidc-exception.filter';
import { LoginUseCase } from 'src/application/use_cases/auth/login';
import { ThirdPartyLoginUseCase } from 'src/application/use_cases/auth/third_party_login';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';
import { CreateUserRequest } from 'src/application/dtos/user/create_user_request';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import {
  toUserPrincipal,
  UserPrincipal,
} from 'src/application/dtos/user/user_principal';
import { Response } from 'express';
import { OidcStateService } from 'src/infrastructure/oidc-state.service';
import { PkceAuthorizationCodeService } from 'src/infrastructure/pkce-authorization-code.service';
import { LogoutUseCase } from 'src/application/use_cases/auth/logout';
import { OidcAuthGuard } from 'src/infrastructure/guards/oidc_auth.guard';
import {
  JwtAuthGuard,
  JwtRefreshAuthGuard,
} from 'src/infrastructure/guards/jwt_auth.guard';
import { CurrentUser } from 'src/infrastructure/decorators/current_user.decorator';
import { Cookie } from 'src/infrastructure/decorators/cookie.decorator';
import { UserPassAuthGuard } from 'src/infrastructure/guards/user_pass_auth.guard';

@UseFilters(OidcExceptionFilter)
@Controller()
export class AuthController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private thirdPartyLoginUseCase: ThirdPartyLoginUseCase,
    private loginUseCase: LoginUseCase,
    private getAuthConfigUseCase: GetAuthConfigUseCase,
    private logoutUseCase: LogoutUseCase,
    private readonly oidcStateService: OidcStateService,
    private readonly pkceAuthorizationCodeService: PkceAuthorizationCodeService,
  ) {}

  private readonly logger = new Logger('AuthController');

  @UseGuards(UserPassAuthGuard)
  @Post('login')
  async login(
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (request.user.provider !== 'LOCAL') {
      const res = await this.thirdPartyLoginUseCase.execute(request.user);
      if (res.isSuccess()) {
        if (res.value.role !== request.user.role) {
          this.logger.debug('User role does not match third-party role!');
        }
        request.user = res.value!;
      } else {
        throw new InternalServerErrorException(
          `Couldn't get LDAP mapping for user`,
        );
      }
    }
    return await this.handleLogin(request, response);
  }

  @UseGuards(OidcAuthGuard)
  @Get('login/oidc')
  oidcLogin() {
    // Redirect to OIDC provider is handled entirely by OidcAuthGuard
  }

  @UseGuards(OidcAuthGuard)
  @Get('login/oidc/callback')
  async oidcLoginCallback(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Find or create the user in the database from the OIDC identity
    const oidcLoginResult = await this.thirdPartyLoginUseCase.execute(
      request.user,
    );

    if (oidcLoginResult.isFailure()) {
      throw new InternalServerErrorException('Failed to process OIDC login');
    }

    // Replace the OIDC principal with the DB-backed principal (has correct user ID)
    request.user = oidcLoginResult.value!;

    // Consume the OIDC state to get returnTo and any PKCE parameters
    const stateEntry = this.oidcStateService.consume(
      request.query.state as string,
    );

    if (
      stateEntry &&
      this.oidcStateService.isAllowedReturnTo(stateEntry.returnTo)
    ) {
      if (this.oidcStateService.isNativeReturnTo(stateEntry.returnTo)) {
        // Native app PKCE flow (RFC 8252): issue an authorization code instead of
        // tokens so the access token never appears in a URL.
        if (!stateEntry.codeChallenge) {
          throw new BadRequestException(
            'code_challenge is required for native OIDC flows',
          );
        }
        const code = this.pkceAuthorizationCodeService.create(
          request.user,
          stateEntry.codeChallenge,
        );
        const sep = stateEntry.returnTo.includes('?') ? '&' : '?';
        response.redirect(
          `${stateEntry.returnTo}${sep}code=${encodeURIComponent(code)}`,
        );
        return;
      }

      // Web client: generate cookies as usual, then redirect
      await this.handleLogin(request, response);
      response.redirect(stateEntry.returnTo);
      return;
    }

    // Default JSON response when no redirect is requested (browser direct call)
    return await this.handleLogin(request, response);
  }

  /**
   * PKCE token exchange endpoint for native app clients (RFC 8252).
   * Validates the authorization code and PKCE verifier, then issues tokens.
   */
  @Post('token')
  async exchangeToken(
    @Body() body: { code: string; codeVerifier: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.code || !body.codeVerifier) {
      throw new BadRequestException('code and codeVerifier are required');
    }

    const user = this.pkceAuthorizationCodeService.consume(
      body.code,
      body.codeVerifier,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    const fakeRequest = { user } as AuthenticatedRequest;
    return await this.handleLogin(fakeRequest, response);
  }

  @Post('sign-up')
  async signUp(@Body() body: CreateUserRequest) {
    // TODO: Investigate why no response is returned on sign up
    this.logger.debug('Sign Up');
    const getAuthConfigResult = await this.getAuthConfigUseCase.execute();
    this.logger.debug(
      'Retrieved auth config: ' + JSON.stringify(getAuthConfigResult),
    );

    if (getAuthConfigResult.isFailure()) {
      this.logger.error('Failed to retrieve auth configuration');
      throw new Error('Failed to retrieve auth configuration');
    }

    const authConfig = getAuthConfigResult.value!;

    if (!authConfig.signupEnabled) {
      this.logger.warn('Sign-up attempt while sign-up is disabled');
      throw new UnauthorizedException('Sign-up is currently disabled');
    }

    const createUserResult = await this.createUserUseCase.execute(body);

    if (createUserResult.isFailure()) {
      this.logger.error(
        'Failed to create user: ' + createUserResult.failure.message,
      );
      throw new Error('Failed to create user');
    }

    const user = toUserPrincipal(createUserResult.value!);

    const loginResult = await this.loginUseCase.execute({
      user,
    } as AuthenticatedRequest);

    if (loginResult.isFailure()) {
      this.logger.error(
        'User created but failed to log in: ' + loginResult.failure.message,
      );
      throw new UnauthorizedException('User created but failed to log in');
    }
    const loginResponse = loginResult.value!;

    this.logger.debug(
      'User created and logged in successfully: ' +
        JSON.stringify(loginResponse),
    );

    return { success: true, value: loginResponse };
  }

  /**
   * @deprecated
   * This endpoint is only kept for backward compatibility.
   * Use the /refresh/invalidate endpoint instead so that refresh tokens are revoked.
   */
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
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
    @Cookie('refresh_token') oldRefreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.handleLogin(request, response);

    // Rotate: revoke the consumed refresh token now that a new one has been issued.
    // We do this after issuing the new tokens so a failure here does not log the user out.
    if (oldRefreshToken && request.user?.id) {
      await this.logoutUseCase.execute({
        userId: request.user.id,
        refreshToken: oldRefreshToken,
      });
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh/invalidate')
  async invalidateRefreshToken(
    @CurrentUser() user: UserPrincipal,
    @Cookie('refresh_token') refreshToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
    @Body() body: { logoutAll?: boolean },
  ) {
    await this.logoutUseCase.execute({
      userId: user.id,
      refreshToken,
      logoutAll: body?.logoutAll,
    });

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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: UserPrincipal) {
    if (!user) throw new UnauthorizedException();
    return { success: true, value: user };
  }

  private async handleLogin(request: AuthenticatedRequest, response: Response) {
    const loginResult = await this.loginUseCase.execute(request);

    if (loginResult.isFailure()) {
      throw new InternalServerErrorException('Failed to generate tokens');
    }

    const { accessToken, refreshToken, userId, message } = loginResult.value!;

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
