import { Injectable } from '@nestjs/common';
import {
  AppConfig,
  IAppConfigRepository,
} from 'src/application/interfaces/app_config_repository';
import { AppConfigEntity } from 'src/infrastructure/database/entities/app_config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const CONFIG_ROW_ID = 1;

@Injectable()
export class TypeOrmAppConfigRepository implements IAppConfigRepository {
  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly _repository: Repository<AppConfigEntity>,
  ) {}

  async getConfig(): Promise<AppConfig> {
    const configEntity = await this._repository.findOne({
      where: { id: CONFIG_ROW_ID },
    });

    if (!configEntity) {
      throw new Error('App configuration row is missing. Ensure migrations have been run.');
    }

    return { signupEnabled: configEntity.signupEnabled };
  }

  async setSignupEnabled(signupEnabled: boolean): Promise<void> {
    await this._repository.upsert(
      { id: CONFIG_ROW_ID, signupEnabled },
      ['id'],
    );
  }
}
