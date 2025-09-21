import Failure from './failure';

export class Result<T> {
  constructor(
    public readonly value?: T,
    public readonly failure?: Failure,
  ) {}

  public get isSuccess(): boolean {
    return !!this.value;
  }

  public get isFailure(): boolean {
    return !!this.failure;
  }

  static failure<T>(_failure: Failure) {
    return new Result<T>(undefined, _failure);
  }

  static success<T>(_value?: T) {
    return new Result<T>(_value);
  }

  public on<U>({
    success,
    failure,
  }: {
    success: (value: T) => U;
    failure: (failure: Failure) => U;
  }) {
    if (this.isSuccess) {
      return success(this.value!);
    }
    return failure(this.failure!);
  }
}
