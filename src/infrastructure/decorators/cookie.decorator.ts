import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookie = createParamDecorator(
  (key: string, context: ExecutionContext): string | null => {
    const { cookies } = context.switchToHttp().getRequest<Request>();
    if (typeof cookies !== 'object' || cookies === null) return null;
    const value = (cookies as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
  },
);
