import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { UpdateUserUseCase } from 'src/application/use_cases/user/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/user/update_user_role';
import { GetUsersUseCase } from 'src/application/use_cases/user/get_users';
import { GetUserByIdUseCase } from 'src/application/use_cases/user/get_user_by_id';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/user/delete_user_by_email';
import { GetUserByIdRequest } from 'src/application/dtos/user/get_user_by_id_request';
import { CreateUserRequest } from 'src/application/dtos/user/create_user_request';
import { UpdateUserRequest } from 'src/application/dtos/user/update_user_request';
import { DeleteUserByEmailRequest } from 'src/application/dtos/user/delete_user_by_email_request';
import { RolesGuard } from 'src/infrastructure/guards/roles.guard';
import { JwtAuthGuard } from 'src/infrastructure/guards/jwt_auth.guard';
import { Roles } from 'src/infrastructure/decorators/roles.decorator';
import { toUserPrincipal } from 'src/application/dtos/user/user_principal';
import { AuthenticatedRequest } from 'src/application/dtos/auth/authenticated_request';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly CreateUserUseCase: CreateUserUseCase,
    private readonly UpdateUserUseCase: UpdateUserUseCase,
    private readonly UpdateUserRoleUseCase: UpdateUserRoleUseCase,
    private readonly GetUsersUseCase: GetUsersUseCase,
    private readonly GetUserByIdUseCase: GetUserByIdUseCase,
    private readonly DeleteUserByEmailUseCase: DeleteUserByEmailUseCase,
  ) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    const getUsersResult = await this.GetUsersUseCase.execute();

    if (getUsersResult.isFailure()) {
      return {
        success: false,
        message: getUsersResult.failure?.message,
      };
    }

    return {
      success: true,
      value: getUsersResult.value!.map(toUserPrincipal),
    };
  }

  @Get(':id')
  async findById(@Param() params: GetUserByIdRequest) {
    const getUsersResult = await this.GetUserByIdUseCase.execute(params);

    if (getUsersResult.isFailure()) {
      return {
        success: false,
        message: getUsersResult.failure?.message,
      };
    }

    return {
      success: true,
      value: toUserPrincipal(getUsersResult.value),
    };
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() createUserDto: CreateUserRequest) {
    const createUserResult =
      await this.CreateUserUseCase.execute(createUserDto);

    if (createUserResult.isFailure()) {
      return {
        success: false,
        message: createUserResult.failure?.message,
      };
    }

    return {
      success: true,
      value: toUserPrincipal(createUserResult.value!),
    };
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param() params: { id: string },
    @Body() updateUserDto: Omit<UpdateUserRequest, 'id'>,
  ) {
    const updateUserResult = await this.UpdateUserUseCase.execute({
      ...updateUserDto,
      ...params,
    });

    if (updateUserResult.isFailure()) {
      return {
        success: false,
        message: updateUserResult.failure?.message,
      };
    }

    return {
      success: true,
      value: toUserPrincipal(updateUserResult.value!),
    };
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  async updateRole(
    @Request() req: AuthenticatedRequest,
    @Param() params: { id: string },
    @Body() body: { role: string },
  ) {
    const updateResult = await this.UpdateUserRoleUseCase.execute({
      id: params.id,
      role: body.role,
      authenticatedUserId: req.user.id, // Replace with actual authenticated user ID
    });

    if (updateResult.isFailure()) {
      return {
        success: false,
        message: updateResult.failure?.message,
      };
    }

    return {
      success: true,
      value: toUserPrincipal(updateResult.value!),
    };
  }

  @Delete()
  @Roles('ADMIN')
  async delete(@Body() deleteUserDto: DeleteUserByEmailRequest) {
    const deleteUserByEmailResult =
      await this.DeleteUserByEmailUseCase.execute(deleteUserDto);

    if (deleteUserByEmailResult.isFailure()) {
      return {
        success: false,
        message: deleteUserByEmailResult.failure?.message,
      };
    }

    return {
      success: true,
      value: null,
    };
  }
}
