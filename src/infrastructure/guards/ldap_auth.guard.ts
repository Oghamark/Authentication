import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  AuthConfig,
  IAuthConfigRepository,
} from 'src/application/interfaces/auth_config_repository';
import { LDAPPropertiesError } from 'src/domain/exceptions/auth.exceptions';
import { isObservable, lastValueFrom } from 'rxjs';
import { Result } from 'src/core/result';

@Injectable()
export class LdapAuthGuard extends AuthGuard('ldap') implements CanActivate {
  constructor(
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // This is very ugly, but I can't call this in handleRequest so must to do it here...
    const configResult = await this.authConfigRepository.get();

    //eslint-disable-next-line
    (context.switchToHttp().getRequest() as any).authConfig = configResult;

    const superResult = await super.canActivate(context);

    if (isObservable(superResult)) {
      return lastValueFrom(superResult);
    } else {
      return superResult;
    }
  }

  handleRequest<T>(err: any, user: any, _info: any, context: any): T {
    if (err || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    //eslint-disable-next-line
    const configResult: Result<AuthConfig> = (
      context.switchToHttp().getRequest()
    ).authConfig;

    if (configResult.isFailure()) {
      throw new InternalServerErrorException(`Couldn't load auth config`);
    }

    const { ldapEmailField, ldapNameField, ldapAdminGroup, ldapUserGroup } =
      configResult.value!;

    const record = user as Record<string, any>;

    const email = record[ldapEmailField ?? 'mail'] as string | undefined;
    const name = record[ldapNameField ?? 'sn'] as string | undefined;

    if (!email) {
      throw new LDAPPropertiesError('email');
    }

    if (!name) {
      throw new LDAPPropertiesError('name');
    }

    const user_groups = (record.memberOf ?? []) as Array<string>;
    if (ldapUserGroup && !user_groups.includes(ldapUserGroup)) {
      throw new UnauthorizedException('User not part of required LDAP group');
    }

    const isAdmin = ldapAdminGroup && user_groups.includes(ldapAdminGroup);

    return {
      ...user,
      provider: 'LDAP',
      email,
      name,
      role: isAdmin ? 'ADMIN' : 'USER',
      id: '',
    } as T;
  }
}
