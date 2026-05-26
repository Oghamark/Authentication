import {
  Inject,
  Injectable,
  Logger,
  // UnauthorizedException,
} from '@nestjs/common';
// import { UserPrincipal } from 'src/application/dtos/user/user_principal';
import { AppConfig, appConfig } from 'src/infrastructure/config';
import {
  AuthConfig,
  IAuthConfigRepository,
} from 'src/application/interfaces/auth_config_repository';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';
import * as passport from 'passport';
import * as LdapStrategy from 'passport-ldapauth';

@Injectable()
export class LdapStrategyFactory {
  constructor(
    @Inject(appConfig.KEY)
    private config: AppConfig,
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  private readonly logger = new Logger('LdapStrategyFactory');

  async createStrategy(authConfig: AuthConfig): Promise<Result<LdapStrategy>> {
    return this.recreateStrategy(authConfig);
  }

  // This must be async to avoid a ton of boilerplate with maually returning Promise<Result<...>> everywhere
  // eslint-disable-next-line @typescript-eslint/require-await
  async recreateStrategy(
    authConfig: AuthConfig,
  ): Promise<Result<LdapStrategy>> {
    const {
      ldapServerUrl,
      ldapEnabled,
      ldapBindDn,
      ldapBindPassword,
      ldapBaseDn,
    } = authConfig;

    if (!ldapEnabled) {
      this.logger.log(
        'LDAP is disabled. LDAP strategy will not be initialized',
      );

      passport.unuse('ldap');
      return Result.fail(new GenericFailure('LDAP is not configured'));
    } else if (
      !ldapServerUrl ||
      !ldapBaseDn ||
      !ldapBindPassword ||
      !ldapBindDn
    ) {
      this.logger.warn(
        'LDAP configuration is incomplete. LDAP strategy will not be initialized.',
      );

      passport.unuse('ldap');
      return Result.fail(new GenericFailure('LDAP is not configured'));
    }

    const options: LdapStrategy.Options = {
      server: {
        url: ldapServerUrl,
        bindDN: ldapBindDn,
        bindCredentials: ldapBindPassword,
        searchBase: ldapBaseDn,
        searchFilter: '(uid={{username}})',
      },
      usernameField: `email`,
      passwordField: `password`,
    };

    const strategy: LdapStrategy = new LdapStrategy(options);
    // Re-registering with the same name overwrites the old strategy
    passport.use('ldap', strategy);
    this.logger.log('LDAP strategy registered successfully');
    return Result.ok(strategy);
  }
}
