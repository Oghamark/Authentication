import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuthConfigRepository } from '../../application/interfaces/auth_config_repository';
import { AuthConfigEntity } from '../database/entities/auth_config.entity';
import { Result } from '../../core/result';

const DEFAULT_ID = 'default';

@Injectable()
export class TypeOrmAuthConfigRepository implements IAuthConfigRepository {
  constructor(
    @InjectRepository(AuthConfigEntity)
    private readonly repository: Repository<AuthConfigEntity>,
  ) {}

  async get(): Promise<Result<{ signupEnabled: boolean }>> {
    let entity = await this.repository.findOne({ where: { id: DEFAULT_ID } });

    if (!entity) {
      entity = this.repository.create({ id: DEFAULT_ID, signupEnabled: true });
      await this.repository.save(entity);
    }

    return Result.ok({ signupEnabled: entity.signupEnabled });
  }

  async update(
    config: Partial<{ signupEnabled: boolean }>,
  ): Promise<Result<{ signupEnabled: boolean }>> {
    let entity = await this.repository.findOne({ where: { id: DEFAULT_ID } });

    if (!entity) {
      entity = this.repository.create({ id: DEFAULT_ID, signupEnabled: true });
    }

    if (config.signupEnabled !== undefined) {
      entity.signupEnabled = config.signupEnabled;
    }

    await this.repository.save(entity);

    return Result.ok({ signupEnabled: entity.signupEnabled });
  }
}
