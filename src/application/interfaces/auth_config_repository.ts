import { Result } from '../../core/result';

export interface IAuthConfigRepository {
  get(): Promise<Result<{ signupEnabled: boolean }>>;
  update(
    config: Partial<{ signupEnabled: boolean }>,
  ): Promise<Result<{ signupEnabled: boolean }>>;
}
