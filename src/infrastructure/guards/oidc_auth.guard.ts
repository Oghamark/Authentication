import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as passport from 'passport';
import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';

type AuthenticateMiddleware = (
  req: Request,
  res: Response,
  next: (err?: Error) => void,
) => void;

type OidcReturnContext = {
  returnTo: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
};

@Injectable()
export class OidcAuthGuard implements CanActivate {
  constructor(
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const configResult = await this.authConfigRepository.get();
    const config = configResult.value;

    if (
      !config?.oidcIssuerUrl ||
      !config?.oidcClientId ||
      !config?.oidcClientSecret
    ) {
      throw new NotImplementedException('OIDC authentication is not enabled');
    }

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    if (request.path.includes('/callback')) {
      return this.handleCallback(request, response);
    }

    return this.handleLoginInitiation(request, response);
  }

  /**
   * Initiates the OIDC flow. Passport stores OIDC state (nonce, PKCE verifier)
   * in the session, then redirects to the provider. We intercept the redirect
   * to explicitly save the session before the response is sent.
   */
  private handleLoginInitiation(
    request: Request,
    response: Response,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const originalRedirect: Response['redirect'] = response.redirect.bind(
        response,
      ) as Response['redirect'];

      response.redirect = function redirect(
        statusOrUrl: number | string,
        url?: string,
      ) {
        request.session.save((err: Error) => {
          if (err) return reject(err);
          response.redirect = originalRedirect;
          if (typeof statusOrUrl === 'number') {
            originalRedirect(statusOrUrl, url!);
          } else {
            originalRedirect(statusOrUrl);
          }
          resolve(true);
        });
        return response;
      } as Response['redirect'];

      // Persist return target and PKCE context in the server session.
      // Do not override the OIDC state value — passport/openid-client manages that.
      try {
        const requestedReturnTo =
          typeof request.query['returnTo'] === 'string'
            ? request.query['returnTo']
            : typeof request.query['redirectUri'] === 'string'
              ? request.query['redirectUri']
              : undefined;

        if (requestedReturnTo) {
          const codeChallenge =
            typeof request.query['code_challenge'] === 'string'
              ? request.query['code_challenge']
              : undefined;
          const codeChallengeMethod =
            typeof request.query['code_challenge_method'] === 'string'
              ? request.query['code_challenge_method']
              : undefined;
          const context: OidcReturnContext = {
            returnTo: requestedReturnTo,
            codeChallenge,
            codeChallengeMethod,
          };
          (request.session as unknown as Record<string, unknown>)[
            'homebranch:oidc'
          ] = context;
        }
      } catch {
        // ignore and continue without state
      }

      const authenticate: AuthenticateMiddleware = passport.authenticate(
        'oidc',
      ) as AuthenticateMiddleware;

      authenticate(request, response, (err?: Error) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  /**
   * Handles the OIDC callback. Uses a custom passport callback to extract
   * the authenticated user from the token exchange.
   */
  private handleCallback(
    request: Request,
    response: Response,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const authenticate: AuthenticateMiddleware = passport.authenticate(
        'oidc',
        (err: Error, user: UserPrincipal) => {
          if (err) return reject(err);
          if (!user) return resolve(false);
          request.user = user;
          resolve(true);
        },
      ) as AuthenticateMiddleware;

      authenticate(request, response, (err?: Error) => {
        if (err) return reject(err);
      });
    });
  }
}
