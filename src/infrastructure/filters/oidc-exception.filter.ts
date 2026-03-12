import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
  HttpException,
  Logger,
} from '@nestjs/common';
import { OidcStateService } from 'src/infrastructure/oidc-state.service';
import { RegistrationDisabledException } from 'src/infrastructure/registration-disabled.exception';
import { Request, Response } from 'express';

@Catch()
@Injectable()
export class OidcExceptionFilter implements ExceptionFilter {
  constructor(private readonly oidcStateService: OidcStateService) {}

  private readonly logger = new Logger('OidcExceptionFilter');

  catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const state = request.query.state as string;
    const returnTo = this.oidcStateService.consume(state);

    if (exception instanceof RegistrationDisabledException) {
      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        const sep = returnTo.includes('?') ? '&' : '?';
        response.redirect(
          `${returnTo}${sep}error=Registration%20not%20allowed`,
        );
        return;
      }

      response.status(403).json({
        success: false,
        code: 'REGISTRATION_DISABLED',
        message: exception.message ?? 'Registration not allowed',
      });
      return;
    }

    // Generic handling for other exceptions during OIDC callback
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      this.logger.error(
        exception.message ?? 'Something went wrong during OIDC callback',
      );
      const sep = returnTo.includes('?') ? '&' : '?';
      response.redirect(
        `${returnTo}${sep}error=${encodeURIComponent('Something went wrong during authentication. See logs for details.')}`,
      );
      return;
    }

    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json({ success: false, message: exception.message });
    } else {
      response
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }
}
