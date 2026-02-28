import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from 'src/application/use_cases/create_user';
import { DeleteUserByEmailUseCase } from 'src/application/use_cases/delete_user_by_email';
import { GetUserByEmailUseCase } from 'src/application/use_cases/get_user_by_email';
import { GetUserByIdUseCase } from 'src/application/use_cases/get_user_by_id';
import { GetUsersUseCase } from 'src/application/use_cases/get_users';
import { UpdateUserUseCase } from 'src/application/use_cases/update_user';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { BcryptCryptoGateway } from 'src/infrastructure/gateways/bcrypt_crypto.gateway';
import { JwtTokenGateway } from 'src/infrastructure/gateways/jwt_token.gateway';
import { UserMapper } from 'src/infrastructure/mappers/user.mapper';
import { TypeOrmUserRepository } from 'src/infrastructure/repositories/user_repository';
import { UserController } from 'src/presentation/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
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
    {
      provide: 'TokenGateway',
      useClass: JwtTokenGateway,
    },

    JwtService,

    // Use Cases (add all that your controller uses)
    GetUsersUseCase,
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    CreateUserUseCase,
    DeleteUserByEmailUseCase,
    UpdateUserUseCase,
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
  ],
})
export class UsersModule {}
