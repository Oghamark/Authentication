import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuditService } from './audit.service';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeIdNames = new Set(['id', 'userId']);

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name);

  constructor(private readonly audit: AuditService) {}

  use(request: Request, response: Response, next: NextFunction) {
    let resultFailure = false;
    const originalJson = response.json;
    response.json = function (body: unknown) {
      resultFailure =
        body !== null &&
        typeof body === 'object' &&
        'success' in body &&
        body.success === false;
      return originalJson.call(this, body) as Response;
    };

    response.on('finish', () => {
      const matchedRoute = request.route as { path?: unknown } | undefined;
      const route = matchedRoute?.path;
      if (typeof route !== 'string' || !route.startsWith('/')) return;
      if (route === '/health' || route === '/audit-logs') return;

      const method = request.method.toUpperCase();
      const oidcLogin =
        method === 'GET' &&
        route === '/login/oidc/callback' &&
        response.locals.auditOidcLoginSuccess === true &&
        response.statusCode >= 200 &&
        response.statusCode < 400;
      if (
        !oidcLogin &&
        (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
          (method === 'POST' &&
            (route === '/refresh' || route === '/users/display-names')))
      )
        return;

      const resourceIds: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.params ?? {})) {
        if (
          safeIdNames.has(key) &&
          typeof value === 'string' &&
          uuid.test(value)
        )
          resourceIds[key] = value;
      }

      const user = request.user;
      const actorId =
        typeof user?.id === 'string' && uuid.test(user.id) ? user.id : null;
      const actorLabel = actorId
        ? typeof user?.email === 'string' && user.email
          ? user.email
          : typeof user?.name === 'string' && user.name
            ? user.name
            : null
        : null;

      void this.audit
        .record({
          actorId,
          actorLabel,
          method,
          route,
          resourceIds,
          statusCode: response.statusCode,
          outcome:
            response.statusCode >= 400 ||
            resultFailure ||
            response.locals.auditOutcomeFailure === true
              ? 'failure'
              : 'success',
        })
        .catch(() => this.logger.error('Failed to persist audit log'));
    });
    next();
  }
}
