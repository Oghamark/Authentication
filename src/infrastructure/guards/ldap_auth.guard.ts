import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LdapAuthGuard extends AuthGuard('ldap') {
  handleRequest<UserPrincipal>(
    err: unknown,
    user: UserPrincipal,
  ): UserPrincipal {
    if (err || !user) {
      throw new UnauthorizedException('Invalid LDAP credentials');
    }
    return user;
  }
}
