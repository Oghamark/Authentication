import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthConfigEntity } from '../infrastructure/database/entities/auth_config.entity';
import { TypeOrmAuthConfigRepository } from '../infrastructure/repositories/auth_config_repository';
import { GetAuthConfigUseCase } from 'src/application/use_cases/config/get_auth_config';
import { UpdateAuthConfigUseCase } from 'src/application/use_cases/config/update_auth_config';
import { ConfigController } from '../presentation/controllers/config.controller';
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
      provide: 'CryptoGateway',
      useClass: BcryptCryptoGateway,
    },
    JwtService,
    GetAuthConfigUseCase,
    UpdateAuthConfigUseCase,
  ],
})
export class AppConfigModule {}
