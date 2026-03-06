import { randomUUID } from 'crypto';

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public isRevoked: boolean = false,
    public revokedAt?: Date,
  ) {}

  static create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      randomUUID(),
      data.userId,
      data.tokenHash,
      data.expiresAt,
      new Date(),
      false,
    );
  }

  static reconstitute(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    isRevoked?: boolean;
    revokedAt?: Date;
  }): RefreshToken {
    return new RefreshToken(
      data.id,
      data.userId,
      data.tokenHash,
      data.expiresAt,
      data.createdAt,
      data.isRevoked || false,
      data.revokedAt,
    );
  }
}
