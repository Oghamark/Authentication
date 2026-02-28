import { Inject, Injectable } from '@nestjs/common';
import { IAppConfigRepository } from '../interfaces/app_config_repository';
import { IUseCase } from '../interfaces/use_case';

@Injectable()
export class GetAuthConfigUseCase
  implements IUseCase<undefined, { signupEnabled: boolean }>
{
  constructor(
    @Inject('AppConfigRepository')
    private readonly appConfigRepository: IAppConfigRepository,
  ) {}

  async execute(): Promise<{ signupEnabled: boolean }> {
    return this.appConfigRepository.getConfig();
  }
}
