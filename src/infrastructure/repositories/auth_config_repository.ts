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
        ldapEnabled: false,
        ldapBaseDn: null,
        ldapBindDn: null,
        ldapBindPassword: null,
        ldapServerUrl: null,
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
      ldapEnabled: entity.ldapEnabled,
      ldapServerUrl: entity.ldapServerUrl,
      ldapBindDn: entity.ldapBaseDn,
      ldapBindPassword: entity.ldapBindPassword,
      ldapBaseDn: entity.ldapBaseDn,
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

    // OIDC
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

    // LDAP
    if (config.ldapEnabled !== undefined) {
      entity.ldapEnabled = config.ldapEnabled;
    }
    if (config.ldapBaseDn !== undefined) {
      entity.ldapBaseDn = config.ldapBaseDn;
    }
    if (config.ldapBindDn !== undefined) {
      entity.ldapBindDn = config.ldapBindDn;
    }
    if (config.ldapBindPassword !== undefined) {
      entity.ldapBindPassword = config.ldapBindPassword;
    }
    if (config.ldapServerUrl !== undefined) {
      entity.ldapServerUrl = config.ldapServerUrl;
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
      ldapEnabled: entity.ldapEnabled,
      ldapBaseDn: entity.ldapBaseDn,
      ldapBindDn: entity.ldapBindDn,
      ldapBindPassword: entity.ldapBindPassword,
      ldapServerUrl: entity.ldapServerUrl,
    });
  }
}
