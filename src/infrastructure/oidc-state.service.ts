import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

type Entry = { returnTo: string; expiresAt: number };

@Injectable()
export class OidcStateService {
  private store = new Map<string, Entry>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  create(returnTo?: string): string {
    const state = crypto.randomBytes(16).toString('hex');
    const entry: Entry = {
      returnTo: returnTo ?? '/',
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
}
