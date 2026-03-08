import { Inject, Injectable } from '@nestjs/common';
import {
  AuthConfig,
  IAuthConfigRepository,
} from 'src/application/interfaces/auth_config_repository';
import { Result } from 'src/core/result';

@Injectable()
export class UpdateAuthConfigUseCase {
  constructor(
    @Inject('AuthConfigRepository')
    private readonly authConfigRepository: IAuthConfigRepository,
  ) {}

  async execute(config: Partial<AuthConfig>): Promise<Result<AuthConfig>> {
    return this.authConfigRepository.update(config);
  }
}
