import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';
import { TypeOrmAuthConfigRepository } from '../infrastructure/repositories/auth_config_repository';
import { GetAuthConfigUseCase } from '../application/use_cases/get_auth_config';
import { UpdateAuthConfigUseCase } from '../application/use_cases/update_auth_config';
import { ConfigController } from '../presentation/controllers/config.controller';
import { JwtTokenGateway } from '../infrastructure/gateways/jwt_token.gateway';
import { BcryptCryptoGateway } from '../infrastructure/gateways/bcrypt_crypto.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([AuthConfigEntity])],
  controllers: [ConfigController],
  providers: [
    {
      provide: 'AuthConfigRepository',
      useClass: TypeOrmAuthConfigRepository,
    },
    {
      provide: 'TokenGateway',
      useClass: JwtTokenGateway,
    },
    {
      provide: 'CryptoGateway',
      useClass: BcryptCryptoGateway,
    },
    JwtService,
    GetAuthConfigUseCase,
    UpdateAuthConfigUseCase,
  ],
})
export class AppConfigModule {}
