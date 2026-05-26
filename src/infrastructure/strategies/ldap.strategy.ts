import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppConfig, appConfig } from 'src/infrastructure/config';
import {
  AuthConfig,
  IAuthConfigRepository,
} from 'src/application/interfaces/auth_config_repository';
import { Result } from 'src/core/result';
import { GenericFailure } from 'src/core/failure';
import * as passport from 'passport';
// Annoying commonjs issue with exported overlapping namespace + class...
// eslint-disable-next-line @typescript-eslint/no-require-imports
import LdapStrategy = require('passport-ldapauth');

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
      ldapEmailField,
      ldapNameField,
    } = authConfig;

    if (!ldapEnabled) {
      this.logger.log(
        'LDAP is disabled. LDAP strategy will not be initialized',
      );

      passport.unuse('ldap');
      return Result.fail(new GenericFailure('LDAP is not configured'));
    } else if (!ldapServerUrl || !ldapBaseDn || !ldapBindDn) {
      this.logger.warn(
        'LDAP configuration is incomplete. LDAP strategy will not be initialized.',
      );

      passport.unuse('ldap');
      return Result.fail(new GenericFailure('LDAP is not configured'));
    }

    const emailField: string = ldapEmailField ?? 'mail';

    const options: LdapStrategy.Options = {
      server: {
        url: ldapServerUrl,
        bindDN: ldapBindDn,
        bindCredentials: ldapBindPassword ?? undefined,
        searchBase: ldapBaseDn,
        searchFilter: `(${emailField}={{username}})`,
        searchAttributes: [
          'cn',
          'sn',
          'memberOf',
          'mail',
          ldapEmailField ?? '',
          ldapNameField ?? '',
        ],
        groupSearchAttributes: ['dn'],
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
