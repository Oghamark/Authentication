import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IAuthConfigRepository } from 'src/application/interfaces/auth_config_repository';
import { LocalAuthGuard } from './local_auth.guard';
import { LdapAuthGuard } from './ldap_auth.guard';

@Injectable()
export class UserPassAuthGuard implements CanActivate {
  constructor(
    private readonly localAuthGuard: LocalAuthGuard,
    private readonly ldapAuthGuard: LdapAuthGuard,
    @Inject('AuthConfigRepository')
    private authConfigRepository: IAuthConfigRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    try {
      await this.localAuthGuard.canActivate(context);
      return true;
    } catch (localLoginException) {
      const authConfigResult = await this.authConfigRepository.get();
      if (
        authConfigResult.isFailure() ||
        !authConfigResult.value!.ldapEnabled
      ) {
        throw localLoginException;
      }
    }

    Logger.debug('Local login failed, falling back to try LDAP');
    return this.ldapAuthGuard.canActivate(context);
  }
}
