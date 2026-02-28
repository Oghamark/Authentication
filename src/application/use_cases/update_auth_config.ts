import { Inject, Injectable } from '@nestjs/common';
import { IAppConfigRepository } from '../interfaces/app_config_repository';
import { IUseCase } from '../interfaces/use_case';
import { UpdateAuthConfigRequest } from '../dtos/update_auth_config_request';

@Injectable()
export class UpdateAuthConfigUseCase
  implements IUseCase<UpdateAuthConfigRequest, void>
{
  constructor(
    @Inject('AppConfigRepository')
    private readonly appConfigRepository: IAppConfigRepository,
  ) {}

  async execute(input: UpdateAuthConfigRequest): Promise<void> {
    await this.appConfigRepository.setSignupEnabled(input.signupEnabled);
  }
}
