/**
 * Failed-attempt lockout algorithm, storage-agnostic. The store is injected per
 * app so staff and customer attempt counters never mix (customer -> its Redis;
 * staff -> its own Redis namespace or internal DB table).
 */
export interface LockoutStore {
  /** Increment the failure counter for `key` within a rolling window; returns the new count. */
  recordFailure(key: string, windowSeconds: number): Promise<number>
  /** Current failure count (0 when none or expired). */
  getFailures(key: string): Promise<number>
  /** Persist a lock until `until` (epoch ms); the store expires it on its own. */
  setLock(key: string, until: number): Promise<void>
  /** Lock expiry (epoch ms) or null when not locked. */
  getLock(key: string): Promise<number | null>
  /** Clear failures + lock (call on a successful login). */
  reset(key: string): Promise<void>
}

export interface LockoutOptions {
  maxAttempts: number
  windowSeconds: number
  lockSeconds: number
}

export interface LockoutStatus {
  locked: boolean
  retryAfterSeconds: number
  remainingAttempts: number
}

export class LoginLockout {
  constructor(
    private readonly store: LockoutStore,
    private readonly options: LockoutOptions
  ) {}

  async status(key: string): Promise<LockoutStatus> {
    const lock = await this.store.getLock(key)
    const now = Date.now()
    if (lock && lock > now) {
      return {
        locked: true,
        retryAfterSeconds: Math.ceil((lock - now) / 1000),
        remainingAttempts: 0,
      }
    }
    const failures = await this.store.getFailures(key)
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: Math.max(0, this.options.maxAttempts - failures),
    }
  }

  async recordFailure(key: string): Promise<LockoutStatus> {
    const count = await this.store.recordFailure(
      key,
      this.options.windowSeconds
    )
    if (count >= this.options.maxAttempts) {
      const until = Date.now() + this.options.lockSeconds * 1000
      await this.store.setLock(key, until)
      return {
        locked: true,
        retryAfterSeconds: this.options.lockSeconds,
        remainingAttempts: 0,
      }
    }
    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: this.options.maxAttempts - count,
    }
  }

  reset(key: string): Promise<void> {
    return this.store.reset(key)
  }
}
