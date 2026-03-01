import { Result } from '../../core/result';

export interface IRepository<T> {
  findById(id: string): Promise<Result<T>>;
  findAll(): Promise<Result<T[]>>;
  save(entity: T): Promise<Result<string>>;
  update(entity: T): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
  count(): Promise<Result<number>>;
  existsById(id: string): Result<Promise<boolean>>;
}
