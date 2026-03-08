import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Express.User => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
