export class JwtPayload {
  constructor(
    public readonly sub: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: string,
    public readonly issuedAt: Date,
    public readonly expiresAt: Date,
  ) {}

  static create(data: {
    userId: string;
    name: string;
    email: string;
    role: string;
  }): JwtPayload {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    return new JwtPayload(
      data.userId,
      data.name,
      data.email,
      data.role,
      now,
      expiresAt,
    );
  }
}
