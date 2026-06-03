/**
 * Represents a user in the system with properties for id, name, email, password, and auth provider.
 * Provides getters and setters for these properties.
 * @param {id} - Unique identifier for the user.
 * @param {name} - Name of the user.
 * @param {email} - Email address of the user.
 * @param {password} - Password for the user account.
 * @param {provider} - Authentication provider.
 */
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password: string | null,
    public role: string = 'USER',
    public provider: string,
  ) {}
}
