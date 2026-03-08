import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthConfig,
  IAuthConfigRepository,
} from 'src/application/interfaces/auth_config_repository';
import { AuthConfigEntity } from '../database/entities/auth_config.entity';
import { Result } from 'src/core/result';

const DEFAULT_ID = 'default';

@Injectable()
export class TypeOrmAuthConfigRepository implements IAuthConfigRepository {
  constructor(
    @InjectRepository(AuthConfigEntity)
    private readonly repository: Repository<AuthConfigEntity>,
  ) {}

  async get(): Promise<Result<AuthConfig>> {
    let entity = await this.repository.findOne({ where: { id: DEFAULT_ID } });

    if (!entity) {
      entity = this.repository.create({
        id: DEFAULT_ID,
        signupEnabled: true,
        oidcEnabled: false,
        oidcIssuerUrl: null,
        oidcClientId: null,
        oidcClientSecret: null,
        oidcCallbackUrl: null,
        oidcProviderName: null,
      });
      await this.repository.save(entity);
    }

    return Result.ok({
      signupEnabled: entity.signupEnabled,
      oidcEnabled: entity.oidcEnabled,
      oidcIssuerUrl: entity.oidcIssuerUrl,
      oidcClientId: entity.oidcClientId,
      oidcClientSecret: entity.oidcClientSecret,
      oidcCallbackUrl: entity.oidcCallbackUrl,
      oidcProviderName: entity.oidcProviderName,
    });
  }

  async update(config: Partial<AuthConfig>): Promise<Result<AuthConfig>> {
    let entity = await this.repository.findOne({ where: { id: DEFAULT_ID } });

    if (!entity) {
      entity = this.repository.create({
        id: DEFAULT_ID,
        signupEnabled: true,
        oidcEnabled: false,
        oidcIssuerUrl: null,
        oidcClientId: null,
        oidcClientSecret: null,
        oidcCallbackUrl: null,
        oidcProviderName: null,
      });
    }

    if (config.signupEnabled !== undefined) {
      entity.signupEnabled = config.signupEnabled;
    }
    if (config.oidcEnabled !== undefined) {
      entity.oidcEnabled = config.oidcEnabled;
    }
    if (config.oidcIssuerUrl !== undefined) {
      entity.oidcIssuerUrl = config.oidcIssuerUrl;
    }
    if (config.oidcClientId !== undefined) {
      entity.oidcClientId = config.oidcClientId;
    }
    if (config.oidcClientSecret !== undefined) {
      entity.oidcClientSecret = config.oidcClientSecret;
    }
    if (config.oidcCallbackUrl !== undefined) {
      entity.oidcCallbackUrl = config.oidcCallbackUrl;
    }
    if (config.oidcProviderName !== undefined) {
      entity.oidcProviderName = config.oidcProviderName;
    }

    await this.repository.save(entity);

    return Result.ok({
      signupEnabled: entity.signupEnabled,
      oidcEnabled: entity.oidcEnabled,
      oidcIssuerUrl: entity.oidcIssuerUrl,
      oidcClientId: entity.oidcClientId,
      oidcClientSecret: entity.oidcClientSecret,
      oidcCallbackUrl: entity.oidcCallbackUrl,
      oidcProviderName: entity.oidcProviderName,
    });
  }
}
