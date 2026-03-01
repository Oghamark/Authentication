import { Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/application/interfaces/user_repository';
import { User } from 'src/domain/entities/user.entity';
import { UserEntity } from 'src/infrastructure/database/entities/user.entity';
import { Repository } from 'typeorm';
import { UserMapper } from '../mappers/user.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { Result } from '../../core/result';
import { GenericFailure } from '../../core/failure';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _repository: Repository<UserEntity>,
  ) {}

  existsById(id: string): Result<Promise<boolean>> {
    const exists = this._repository.exists({ where: { id } });

    return Result.ok(exists);
  }

  async findAll(): Promise<Result<User[]>> {
    const userEntities = await this._repository.find();
    const users = UserMapper.toDomainList(userEntities);

    return Result.ok(users);
  }

  async update(entity: User): Promise<Result<void>> {
    const userEntity = UserMapper.toPersistence(entity);
    await this._repository.save(userEntity);
    return Result.ok();
  }

  async delete(id: string): Promise<Result<void>> {
    await this._repository.delete(id);
    return Result.ok();
  }

  async count(): Promise<Result<number>> {
    const count = await this._repository.count();
    return Result.ok(count);
  }

  async save(user: User): Promise<Result<string>> {
    const userEntity = UserMapper.toPersistence(user);
    const { id } = await this._repository.save(userEntity);
    return Result.ok(id);
  }

  async findByEmail(email: string): Promise<Result<User>> {
    const userEntity = await this._repository.findOne({ where: { email } });

    if (!userEntity) {
      return Result.fail(new GenericFailure('User not found'));
    }
    const user = UserMapper.toDomain(userEntity);
    return Result.ok(user);
  }

  async findByName(name: string): Promise<Result<User>> {
    const userEntity = await this._repository.findOne({ where: { name } });

    if (!userEntity) {
      return Result.fail(new GenericFailure('User not found'));
    }

    const user = UserMapper.toDomain(userEntity);
    return Result.ok(user);
  }

  async findById(id: string): Promise<Result<User>> {
    const userEntity = await this._repository.findOne({ where: { id } });

    if (!userEntity) {
      return Result.fail(new GenericFailure('User not found'));
    }

    const user = UserMapper.toDomain(userEntity);
    return Result.ok(user);
  }
}
