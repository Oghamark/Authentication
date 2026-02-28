import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/modules/auth.module';
import { CreateUserUseCase } from 'src/application/use_cases/create_user';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/delete_user_by_email';
import { GetUserByEmailUseCase } from 'src/application/use_cases/get_user_by_email';
import { GetUserByIdUseCase } from 'src/application/use_cases/get_user_by_id';
import { GetUsersUseCase } from 'src/application/use_cases/get_users';
import { UpdateUserUseCase } from 'src/application/use_cases/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/update_user_role';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { BcryptCryptoGateway } from 'src/infrastructure/gateways/bcrypt_crypto.gateway';
import { UserMapper } from 'src/infrastructure/mappers/user.mapper';
import { TypeOrmUserRepository } from 'src/infrastructure/repositories/user_repository';
import { UserController } from 'src/presentation/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  providers: [
    // Repository
    {
      provide: 'UserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'CryptoGateway',
      useClass: BcryptCryptoGateway,
    },

    // Use Cases (add all that your controller uses)
    GetUsersUseCase,
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    CreateUserUseCase,
    DeleteUserByEmailUseCase,
    UpdateUserUseCase,
    UpdateUserRoleUseCase,
    // ... other use cases

    // Mappers
    UserMapper,
  ],
  controllers: [UserController],
  exports: [
    'UserRepository',
    'CryptoGateway',
    UserMapper,
    GetUsersUseCase,
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    CreateUserUseCase,
    DeleteUserByEmailUseCase,
    UpdateUserUseCase,
    UpdateUserRoleUseCase,
  ],
})
export class UsersModule {}
