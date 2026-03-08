import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<UserPrincipal>(
    err: unknown,
    user: UserPrincipal,
  ): UserPrincipal {
    if (err || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
