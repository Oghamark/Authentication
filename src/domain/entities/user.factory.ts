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
    role = 'USER',
  }: Pick<User, 'email' | 'name' | 'password'> & { role?: string }): User {
    if (!name || !email || !password) {
      throw new Error('All fields are required to create a user');
    }

    return new User(randomUUID(), name, email, password, role);
  }

  static createPrincipal({
    name,
    email,
    role = 'USER',
  }: Pick<User, 'email' | 'name'> & { role?: string }): User {
    if (!name || !email) {
      throw new Error('Name and email are required to create a principal user');
    }

    return new User(randomUUID(), name, email, null, role);
  }

  static reconstitute({
    id,
    name,
    email,
    password,
    role,
  }: Pick<User, 'id' | 'name' | 'email' | 'role'> & {
    password: string | null;
  }): User {
    if (!id || !name || !email || !role) {
      throw new Error('All fields are required to reconstitute a user');
    }

    return new User(id, name, email, password, role);
  }
}
