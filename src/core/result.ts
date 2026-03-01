import { Failure } from './failure';

export class Result<T = void> {
  readonly success: boolean;
  readonly failure?: Failure;
  readonly value?: T;

  constructor(success: boolean, value?: T, failure?: Failure) {
    this.success = success;
    this.value = value;
    this.failure = failure;
  }

  static ok<T = void>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(failure: Failure, value?: T): Result<T> {
    return new Result<T>(false, value, failure);
  }

  isSuccess(): this is Result<T> & { value: T } {
    return this.success;
  }

  isFailure(): this is Result<T> & { failure: Failure } {
    return !this.success;
  }
}
