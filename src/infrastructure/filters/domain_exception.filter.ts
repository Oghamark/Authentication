import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain_exception';
import {
  InvalidCredentialsError,
  InvalidTokenError,
  PasswordsDontMatchException,
} from '../../domain/exceptions/auth.exceptions';
import {
  UserAlreadyExistsError,
  UserNotFoundError,
  UserWithEmailNotFoundError,
} from '../../domain/exceptions/user.exceptions';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}
  catch(exception: DomainException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request: Request = context.getRequest();

    let status: HttpStatus;
    let message: string;
    let code: string;

    // Map domain exceptions to HTTP responses
    if (exception instanceof UserAlreadyExistsError) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
      code = 'USER_ALREADY_EXISTS';
    } else if (exception instanceof UserNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      code = 'USER_NOT_FOUND';
    } else if (exception instanceof UserWithEmailNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      code = 'USER_WITH_EMAIL_NOT_FOUND';
    } else if (exception instanceof InvalidCredentialsError) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
      code = 'INVALID_CREDENTIALS';
    } else if (exception instanceof InvalidTokenError) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
      code = 'UNAUTHORIZED';
    } else if (exception instanceof PasswordsDontMatchException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;
      code = 'PASSWORDS_DONT_MATCH';
    } else {
      // Generic error handling
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_ERROR';

      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        { url: request.url, method: request.method },
      );
    }

    const errorResponse = {
      message: [message],
      error: code,
      statusCode: status,
    };

    response.status(status).json(errorResponse);
  }
}
