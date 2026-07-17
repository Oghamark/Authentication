import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfig, appConfig } from 'src/infrastructure/config';

type Entry = { returnTo: string; expiresAt: number };

@Injectable()
export class OidcStateService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) {}

  private store = new Map<string, Entry>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  create(returnTo?: string): string {
    const state = crypto.randomBytes(16).toString('hex');
    const normalizedReturnTo = this.normalizeReturnTo(returnTo) ?? '/';
    const entry: Entry = {
      returnTo: normalizedReturnTo,
      expiresAt: Date.now() + this.ttl,
    };
    this.store.set(state, entry);
    // schedule cleanup
    setTimeout(() => this.store.delete(state), this.ttl + 1000);
    return state;
  }

  consume(state?: string): string | null {
    if (!state) return null;
    const entry = this.store.get(state);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(state);
      return null;
    }
    this.store.delete(state);
    return entry.returnTo;
  }

  isAllowedReturnTo(returnTo: string | null | undefined): returnTo is string {
    if (!returnTo) {
      return false;
    }

    return this.normalizeReturnTo(returnTo) === returnTo;
  }

  private normalizeReturnTo(returnTo?: string): string | null {
    if (!returnTo || !returnTo.trim()) {
      return '/';
    }

    const candidate = returnTo.trim();
    if (this.isSafeRelativePath(candidate)) {
      return candidate;
    }

    return this.isAllowedAbsoluteRedirect(candidate) ? candidate : null;
  }

  private isSafeRelativePath(path: string): boolean {
    return path.startsWith('/') && !path.startsWith('//');
  }

  private isAllowedAbsoluteRedirect(target: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return false;
    }

    const protocol = parsed.protocol.replace(':', '').toLowerCase();
    if (this.config.nativeRedirectUriSchemes.includes(protocol)) {
      return true;
    }

    let appUrl: URL;
    try {
      appUrl = new URL(this.config.appUrl);
    } catch {
      return false;
    }

    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.origin === appUrl.origin
    );
  }
}
