import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetAuthConfigUseCase } from '../../application/use_cases/get_auth_config';
import { UpdateAuthConfigUseCase } from '../../application/use_cases/update_auth_config';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt_auth.guard';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';

@Controller('config')
export class ConfigController {
  constructor(
    private readonly getAuthConfigUseCase: GetAuthConfigUseCase,
    private readonly updateAuthConfigUseCase: UpdateAuthConfigUseCase,
  ) {}

  @Get()
  async getConfig() {
    const result = await this.getAuthConfigUseCase.execute();

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, value: result.value };
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateConfig(@Body() body: { signupEnabled?: boolean }) {
    const result = await this.updateAuthConfigUseCase.execute(body);

    if (result.isFailure()) {
      return { success: false, message: result.failure?.message };
    }

    return { success: true, value: result.value };
  }
}
