import { DomainException } from './domain_exception';

export class InvalidCredentialsError extends DomainException {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidTokenError extends DomainException {
  constructor(message = 'Invalid or malformed token') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class PasswordsDontMatchException extends DomainException {
  constructor() {
    super('Passwords do not match');
    this.name = 'PasswordsDontMatchException';
  }
}

export class SignupDisabledError extends DomainException {
  constructor() {
    super('Public signup is currently disabled');
    this.name = 'SignupDisabledError';
  }
}
