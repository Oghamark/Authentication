import { Controller, Get } from '@nestjs/common';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';

@Controller('oidc')
export class OidcController {
  constructor(private readonly getAuthConfigUseCase: GetAuthConfigUseCase) {}

  @Get('enabled')
  async isEnabled() {
    const result = await this.getAuthConfigUseCase.execute();

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, oidcEnabled: result.value!.oidcEnabled };
  }
}
