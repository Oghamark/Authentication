export abstract class Failure {
  readonly code: string;
  readonly message: string;

  protected constructor(code: string, message: string) {
    this.code = code;
    this.message = message;
  }
}

export class GenericFailure extends Failure {
  constructor(message: string) {
    super('GENERIC_ERROR', message);
  }
}
