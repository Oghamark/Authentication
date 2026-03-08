import { HttpException, HttpStatus } from '@nestjs/common';

export class RegistrationDisabledException extends HttpException {
  constructor(message = 'Registration is disabled') {
    super({ code: 'REGISTRATION_DISABLED', message }, HttpStatus.FORBIDDEN);
  }
}
