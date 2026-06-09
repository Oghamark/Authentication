import { join } from 'path';
import { AuthConfigEntity } from './entities/auth_config.entity';
import { RefreshTokenEntity } from './entities/refresh_token.entity';
import { UserEntity } from './entities/user.entity';

export const typeOrmEntities = [
  UserEntity,
  RefreshTokenEntity,
  AuthConfigEntity,
];

export const typeOrmMigrations = [
  join(__dirname, '..', '..', 'migrations', '*{.ts,.js}'),
];

export const typeOrmSubscribers = [
  join(__dirname, '..', 'subscriber', '*{.ts,.js}'),
];
