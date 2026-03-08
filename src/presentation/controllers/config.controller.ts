import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { UpdateAuthConfigUseCase } from 'src/application/use_cases/config/update_auth_config';
import { RolesGuard } from 'src/infrastructure/guards/roles.guard';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';
import { Roles } from 'src/infrastructure/decorators/roles.decorator';
import { UpdateAuthConfigRequest } from 'src/application/dtos/config/update_auth_config_request';
import { OidcStrategyFactory } from 'src/infrastructure/strategies/oidc.strategy';

@Controller('config')
export class ConfigController {
  constructor(
    private readonly getAuthConfigUseCase: GetAuthConfigUseCase,
    private readonly updateAuthConfigUseCase: UpdateAuthConfigUseCase,
    private readonly oidcStrategyFactory: OidcStrategyFactory,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getConfig() {
    const result = await this.getAuthConfigUseCase.execute();

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, value: result.value };
  }

  // Create public endpoint for getting safe auth config (without secrets)
  @Get('public')
  async getPublicConfig() {
    const result = await this.getAuthConfigUseCase.execute();

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    const { signupEnabled, oidcEnabled, oidcProviderName } = result.value!;
    return {
      success: true,
      value: { signupEnabled, oidcProviderName, oidcEnabled },
    };
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateConfig(@Body() body: UpdateAuthConfigRequest) {
    const result = await this.updateAuthConfigUseCase.execute(body);

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    const hasOidcFields =
      body.oidcIssuerUrl !== undefined ||
      body.oidcClientId !== undefined ||
      body.oidcClientSecret !== undefined;

    if (hasOidcFields) {
      await this.oidcStrategyFactory.recreateStrategy();
    }

    return { success: true, value: result.value };
  }
}
