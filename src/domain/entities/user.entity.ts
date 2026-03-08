/**
 * Represents a user in the system with properties for id, name, email, and password.
 * Provides getters and setters for these properties.
 * @param {id} - Unique identifier for the user.
 * @param {name} - Name of the user.
 * @param {email} - Email address of the user.
 * @param {password} - Password for the user account.
 */
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password: string | null,
    public role: string = 'USER',
  ) {}
}
