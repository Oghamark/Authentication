import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserPrincipal } from 'src/application/dtos/user/user_principal';

type CodeEntry = {
  user: UserPrincipal;
  codeChallenge: string;
  expiresAt: number;
};

/**
 * Issues short-lived PKCE authorization codes for native app OIDC flows (RFC 8252).
 * The code is single-use and expires after 60 seconds.
 */
@Injectable()
export class PkceAuthorizationCodeService {
  private readonly store = new Map<string, CodeEntry>();
  private readonly ttl = 60 * 1000; // 1 minute

  create(user: UserPrincipal, codeChallenge: string): string {
    const code = crypto.randomBytes(32).toString('base64url');
    this.store.set(code, {
      user,
      codeChallenge,
      expiresAt: Date.now() + this.ttl,
    });
    setTimeout(() => this.store.delete(code), this.ttl + 1000);
    return code;
  }

  /**
   * Validates the authorization code and PKCE verifier.
   * Returns the stored UserPrincipal on success, null on any failure.
   * Always consumes (deletes) the code whether or not verification succeeds.
   */
  consume(code: string, codeVerifier: string): UserPrincipal | null {
    const entry = this.store.get(code);
    this.store.delete(code);

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;

    // Verify S256: BASE64URL(SHA256(codeVerifier)) must equal codeChallenge
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier, 'ascii')
      .digest('base64url');

    if (hash !== entry.codeChallenge) return null;

    return entry.user;
  }
}
