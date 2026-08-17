/**
 * Access-token revocation by `jti`. The store is injected per app so staff and
 * customer denylists never share a keyspace (customer -> its Redis; staff ->
 * its own Redis namespace or DB). Entries expire at the access-token TTL.
 */
export interface DenylistStore {
  deny(jti: string, ttlSeconds: number): Promise<void>
  denyMany(jtis: string[], ttlSeconds: number): Promise<void>
  isDenied(jti: string): Promise<boolean>
}

export class TokenDenylist {
  constructor(private readonly store: DenylistStore) {}

  async deny(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return
    await this.store.deny(jti, ttlSeconds)
  }

  async denyMany(jtis: string[], ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0 || jtis.length === 0) return
    await this.store.denyMany(jtis, ttlSeconds)
  }

  isDenied(jti: string): Promise<boolean> {
    return this.store.isDenied(jti)
  }
}
