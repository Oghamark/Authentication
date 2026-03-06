export class JwtPayload {
  constructor(
    public readonly sub: string,
    public readonly email: string,
    public readonly roles: string[],
    public readonly issuedAt: Date,
    public readonly expiresAt: Date,
  ) {}

  static create(data: {
    userId: string;
    email: string;
    roles: string[];
  }): JwtPayload {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    return new JwtPayload(data.userId, data.email, data.roles, now, expiresAt);
  }
}
