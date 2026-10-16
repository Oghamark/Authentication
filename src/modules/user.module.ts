import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/modules/auth.module';
import { CreateUserUseCase } from 'src/application/use_cases/user/create_user';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/user/delete_user_by_email';
import { GetUserByEmailUseCase } from 'src/application/use_cases/user/get_user_by_email';
import { GetUserByIdUseCase } from 'src/application/use_cases/user/get_user_by_id';
import { GetUsersUseCase } from 'src/application/use_cases/user/get_users';
import { UpdateUserUseCase } from 'src/application/use_cases/user/update_user';
import { UpdateUserRoleUseCase } from 'src/application/use_cases/user/update_user_role';
import { SearchUsersUseCase } from 'src/application/use_cases/user/search_users';
import { GetDisplayNamesUseCase } from 'src/application/use_cases/user/get_display_names';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { BcryptCryptoGateway } from 'src/infrastructure/gateways/bcrypt_crypto.gateway';
import { UserMapper } from 'src/infrastructure/mappers/user.mapper';
import { TypeOrmUserRepository } from 'src/infrastructure/repositories/user_repository';
import { UserController } from 'src/presentation/controllers/user.controller';
import { SearchSocialAccountsUseCase } from 'src/application/use_cases/user/search_social_accounts';
import { SocialSearchRateGuard } from 'src/infrastructure/guards/social_search_rate.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  providers: [
    SearchSocialAccountsUseCase,
    SocialSearchRateGuard,
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
    SearchUsersUseCase,
    GetDisplayNamesUseCase,
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
    SearchUsersUseCase,
    GetDisplayNamesUseCase,
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    CreateUserUseCase,
    DeleteUserByEmailUseCase,
    UpdateUserUseCase,
    UpdateUserRoleUseCase,
  ],
})
export class UsersModule {}
