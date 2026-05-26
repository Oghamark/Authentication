import { randomUUID } from 'crypto';
import { User } from './user.entity';

/**
 * Factory class for creating and updating User entities.
 * Provides methods to create a new user and update an existing user.
 */
export class UserFactory {
  /**
   * Creates a new user with the provided data.
   * @param data - The data to create a new user.
   * @returns A new User instance.
   */
  static create({
    name,
    email,
    password,
    provider,
    role = 'USER',
  }: Pick<User, 'email' | 'name' | 'password' | 'provider'> & {
    role?: string;
  }): User {
    if (!name || !email || !password) {
      throw new Error('All fields are required to create a user');
    }

    return new User(randomUUID(), name, email, password, role, provider);
  }

  static createPrincipal({
    name,
    email,
    role = 'USER',
    provider,
  }: Pick<User, 'email' | 'name' | 'provider'> & { role?: string }): User {
    if (!name || !email) {
      throw new Error('Name and email are required to create a principal user');
    }

    return new User(randomUUID(), name, email, null, role, provider);
  }

  static reconstitute({
    id,
    name,
    email,
    password,
    role,
    provider,
  }: Pick<User, 'id' | 'name' | 'email' | 'role' | 'provider'> & {
    password: string | null;
  }): User {
    if (!id || !name || !email || !role) {
      throw new Error('All fields are required to reconstitute a user');
    }

    return new User(id, name, email, password, role, provider);
  }
}
