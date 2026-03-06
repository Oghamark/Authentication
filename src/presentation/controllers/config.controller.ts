import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { UpdateAuthConfigUseCase } from 'src/application/use_cases/config/update_auth_config';
import { RolesGuard } from 'src/infrastructure/guards/roles.guard';
import { Roles } from 'src/infrastructure/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfigController {
  constructor(
    private readonly getAuthConfigUseCase: GetAuthConfigUseCase,
    private readonly updateAuthConfigUseCase: UpdateAuthConfigUseCase,
  ) {}

  @Get()
  @Roles('ADMIN')
  async getConfig() {
    const result = await this.getAuthConfigUseCase.execute();

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, value: result.value };
  }

  @Patch()
  @Roles('ADMIN')
  async updateConfig(@Body() body: { signupEnabled?: boolean }) {
    const result = await this.updateAuthConfigUseCase.execute(body);

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, value: result.value };
  }
}
