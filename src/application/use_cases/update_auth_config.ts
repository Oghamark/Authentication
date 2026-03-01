import { Inject, Injectable } from '@nestjs/common';
import { IAuthConfigRepository } from '../interfaces/auth_config_repository';
import { Result } from '../../core/result';

@Injectable()
export class UpdateAuthConfigUseCase {
  constructor(
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  async execute(
    config: Partial<{ signupEnabled: boolean }>,
  ): Promise<Result<{ signupEnabled: boolean }>> {
    return this.authConfigRepository.update(config);
  }
}
