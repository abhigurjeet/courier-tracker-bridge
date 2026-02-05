export interface TokenCache {
  get(): Promise<string | null>;
  set(token: string, expiresInSeconds: number): Promise<void>;
  clear(): Promise<void>;
}

export interface CachedToken {
  token: string;
  expiresAt: number;
}

export class MemoryTokenCache implements TokenCache {
  private cache: CachedToken | null = null;

  async get(): Promise<string | null> {
    if (!this.cache) {
      return null;
    }

    const now = Date.now();
    if (this.cache.expiresAt <= now + 60000) {
      this.cache = null;
      return null;
    }

    return this.cache.token;
  }

  async set(token: string, expiresInSeconds: number): Promise<void> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    this.cache = { token, expiresAt };
  }

  async clear(): Promise<void> {
    this.cache = null;
  }
}
