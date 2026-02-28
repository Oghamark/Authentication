import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateUserUseCase } from 'src/application/use_cases/create_user';
import { UpdateUserUseCase } from 'src/application/use_cases/update_user';
import { GetUsersUseCase } from 'src/application/use_cases/get_users';
import { GetUserByIdUseCase } from 'src/application/use_cases/get_user_by_id';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/delete_user_by_email';
import { GetUserByIdRequest } from '../../application/dtos/get_user_by_id_request';
import { CreateUserRequest } from '../../application/dtos/create_user_request';
import { UpdateUserRequest } from '../../application/dtos/update_user_request';
import { DeleteUserByEmailRequest } from '../../application/dtos/delete_user_by_email_request';
import { User } from '../../domain/entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly CreateUserUseCase: CreateUserUseCase,
    private readonly UpdateUserUseCase: UpdateUserUseCase,
    private readonly GetUsersUseCase: GetUsersUseCase,
    private readonly GetUserByIdUseCase: GetUserByIdUseCase,
    private readonly DeleteUserByEmailUseCase: DeleteUserByEmailUseCase,
  ) {}

  @Get()
  async findAll() {
    const getUsersResult = await this.GetUsersUseCase.execute();

    if (getUsersResult.isFailure) {
      return {
        success: false,
        message: getUsersResult.failure?.message,
      };
    }

    return {
      success: true,
      value: getUsersResult.value,
    };
  }

  @Get(':id')
  async findById(@Param() params: GetUserByIdRequest) {
    const getUsersResult = await this.GetUserByIdUseCase.execute(params);

    if (getUsersResult.isFailure) {
      return {
        success: false,
        message: getUsersResult.failure?.message,
      };
    }

    return {
      success: true,
      value: getUsersResult.value,
    };
  }

  @Post()
  async create(@Body() createUserDto: CreateUserRequest) {
    const createUserResult =
      await this.CreateUserUseCase.execute(createUserDto);

    if (createUserResult.isFailure) {
      return {
        success: false,
        message: createUserResult.failure?.message,
      };
    }

    return {
      success: true,
      value: createUserResult.value,
    };
  }

  @Post(':id')
  async update(
    @Param() params: { id: string },
    @Body() updateUserDto: Omit<UpdateUserRequest, 'id'>,
  ) {
    const updateUserResult = await this.UpdateUserUseCase.execute({
      ...updateUserDto,
      ...params,
    });

    if (updateUserResult.isFailure) {
      return {
        success: false,
        message: updateUserResult.failure?.message,
      };
    }

    return {
      success: true,
      value: updateUserResult.value,
    };
  }

  @Delete()
  async delete(@Body() deleteUserDto: DeleteUserByEmailRequest) {
    const deleteUserByEmailResult =
      await this.DeleteUserByEmailUseCase.execute(deleteUserDto);

    if (deleteUserByEmailResult.isFailure) {
      return {
        success: false,
        message: deleteUserByEmailResult.failure?.message,
      };
    }

    return {
      success: true,
      value: deleteUserByEmailResult.value,
    };
  }
}
