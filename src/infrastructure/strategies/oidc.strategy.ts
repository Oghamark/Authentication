import { PassportStrategy } from '@nestjs/passport';
import { Client, Issuer, Strategy, TokenSet } from 'openid-client';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { AppConfig, appConfig } from 'src/infrastructure/config';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';
import * as passport from 'passport';

@Injectable()
export class OidcStrategyFactory {
  constructor(
    @Inject(appConfig.KEY)
    private config: AppConfig,
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  private readonly logger = new Logger('OidcStrategyFactory');

  async createStrategy(): Promise<Result<OidcStrategy>> {
    return this.recreateStrategy();
  }

  async recreateStrategy(): Promise<Result<OidcStrategy>> {
    const configResult = await this.authConfigRepository.get();
    if (configResult.isFailure()) {
      return Result.fail(new GenericFailure('Failed to load auth config'));
    }

    const { oidcIssuerUrl, oidcClientId, oidcClientSecret, oidcCallbackUrl } =
      configResult.value!;

    if (
      !oidcIssuerUrl ||
      !oidcClientId ||
      !oidcClientSecret ||
      !oidcCallbackUrl
    ) {
      this.logger.warn(
        'OIDC configuration is incomplete. OIDC strategy will not be initialized.',
      );
      // Unregister any existing strategy
      passport.unuse('oidc');
      return Result.fail(new GenericFailure('OIDC is not configured'));
    }

    const issuer = await Issuer.discover(oidcIssuerUrl);

    const client = new issuer.Client({
      client_id: oidcClientId,
      client_secret: oidcClientSecret,
      redirect_uris: [oidcCallbackUrl],
      response_types: ['code'],
    });

    const strategy = new OidcStrategy(client);
    // Re-registering with the same name overwrites the old strategy
    passport.use('oidc', strategy);
    this.logger.log('OIDC strategy registered successfully');
    return Result.ok(strategy);
  }
}

export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(private client: Client) {
    super({ client, params: { scope: 'openid email profile' } });
  }

  async validate(tokenSet: TokenSet): Promise<UserPrincipal> {
    const userinfo = await this.client.userinfo(tokenSet);
    if (!userinfo.email) {
      throw new UnauthorizedException('Email is required for authentication');
    }

    return {
      id: '', // Placeholder — replaced by OidcLoginUseCase after DB lookup/creation
      email: userinfo.email,
      name: userinfo.name ?? userinfo.email,
      role: 'USER',
    };
  }
}
