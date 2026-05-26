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
import { isObservable, lastValueFrom } from 'rxjs';

@Injectable()
export class UserPassAuthGuard implements CanActivate {
  constructor(
    private readonly localAuthGuard: LocalAuthGuard,
    private readonly ldapAuthGuard: LdapAuthGuard,
    @Inject('AuthConfigRepository')
    private authConfigRepository: IAuthConfigRepository,
  ) {}

  private readonly logger = new Logger('UserPassAuthGuard');

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
    const ldapResult = this.ldapAuthGuard.canActivate(context);

    // This seems to be required because of some nextJS jank? Not sure...
    if (isObservable(ldapResult)) {
      return lastValueFrom(ldapResult);
    } else {
      return ldapResult;
    }
  }
}
