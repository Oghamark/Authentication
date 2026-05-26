import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LDAPPropertiesError } from 'src/domain/exceptions/auth.exceptions';

@Injectable()
export class LdapAuthGuard extends AuthGuard('ldap') {
  handleRequest<T>(err: any, user: any): T {
    if (err || !user) {
      throw new UnauthorizedException('Invalid LDAP credentials');
    }

    const record = user as Record<string, any>;

    const email = (record.mail ?? record.cn) as string | undefined;
    const name = (record.name ?? record.sn ?? record.cn) as string | undefined;

    if (!email) {
      throw new LDAPPropertiesError('email');
    }

    if (!name) {
      throw new LDAPPropertiesError('name');
    }

    return {
      ...user,
      provider: 'LDAP',
      email,
      name,
      // TODO
      role: 'USER',
      id: '',
    } as T;
  }
}
