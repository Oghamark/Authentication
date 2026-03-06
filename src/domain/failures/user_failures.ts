import { Failure } from 'src/core/failure';

export class UserNotFoundFailure extends Failure {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}
