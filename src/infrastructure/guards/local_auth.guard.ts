import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Here be dragons! Turns out UserPrincipal is not THE UserPrincipal from
  // 'src/application/dtos/user/user_principal', just a generic parameter
  handleRequest<UserPrincipal>(
    err: unknown,
    user: UserPrincipal,
  ): UserPrincipal {
    if (err || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { provider: 'local', ...user };
  }
}
