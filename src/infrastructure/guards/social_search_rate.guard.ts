import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';

@Injectable()
export class SocialSearchRateGuard implements CanActivate {
  private readonly windows = new Map<
    string,
    { count: number; expires: number }
  >();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const id = http.getRequest<AuthenticatedRequest>().user?.id;
    if (!id) throw new UnauthorizedException();
    const now = Date.now();
    for (const [key, window] of this.windows) {
      if (window.expires <= now) this.windows.delete(key);
    }
    let window = this.windows.get(id);
    if (!window) {
      if (this.windows.size >= 10000) {
        throw new ServiceUnavailableException(
          'Account search is busy; retry later',
        );
      }
      window = { count: 0, expires: now + 60000 };
      this.windows.set(id, window);
    }
    if (window.count >= 30) {
      const retryAfter = Math.ceil((window.expires - now) / 1000);
      http.getResponse<Response>().setHeader('Retry-After', retryAfter);
      throw new HttpException('Account search limit reached; retry later', 429);
    }
    window.count++;
    return true;
  }
}
