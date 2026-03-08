import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  handleRequest<UserPrincipal>(
    err: unknown,
    user: UserPrincipal,
  ): UserPrincipal {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return user;
  }
}
