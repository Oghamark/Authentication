import { Result } from 'src/core/result';

export interface IUseCase<I, O> {
  execute(input: I): Promise<Result<O>>;
}
