import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CreateUserUseCase } from 'src/application/use_cases/create_user';
import { UpdateUserUseCase } from 'src/application/use_cases/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/update_user_role';
import { GetUsersUseCase } from 'src/application/use_cases/get_users';
import { GetUserByIdUseCase } from 'src/application/use_cases/get_user_by_id';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/delete_user_by_email';
import { GetUserByIdRequest } from '../../application/dtos/get_user_by_id_request';
import { CreateUserRequest } from '../../application/dtos/create_user_request';
import { UpdateUserRequest } from '../../application/dtos/update_user_request';
import { UpdateUserRoleRequest } from '../../application/dtos/update_user_role_request';
import { DeleteUserByEmailRequest } from '../../application/dtos/delete_user_by_email_request';
import { User } from '../../domain/entities/user.entity';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt_auth.guard';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';

@Controller('users')
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
  findAll(): Promise<User[]> {
    return this.GetUsersUseCase.execute();
  }

  @Get(':id')
  findById(@Param() params: GetUserByIdRequest): Promise<User> {
    return this.GetUserByIdUseCase.execute(params);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createUserDto: CreateUserRequest): Promise<User> {
    return this.CreateUserUseCase.execute(createUserDto);
  }

  @Post(':id')
  async update(
    @Param() params: { id: string },
    @Body() updateUserDto: Omit<UpdateUserRequest, 'id'>,
  ): Promise<User> {
    return this.UpdateUserUseCase.execute({ ...updateUserDto, ...params });
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateRole(
    @Req() request: Request,
    @Param() params: { id: string },
    @Body() updateUserRoleDto: Omit<UpdateUserRoleRequest, 'id' | 'authenticatedUserId'>,
  ): Promise<User> {
    const authenticatedUserId = (request['user'] as { id: string }).id;
    return this.UpdateUserRoleUseCase.execute({
      ...updateUserRoleDto,
      ...params,
      authenticatedUserId,
    });
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Body() deleteUserDto: DeleteUserByEmailRequest): Promise<void> {
    return this.DeleteUserByEmailUseCase.execute(deleteUserDto);
  }
}
