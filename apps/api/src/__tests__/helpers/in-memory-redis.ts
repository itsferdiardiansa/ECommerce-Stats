import type { ChainableCommander } from 'ioredis'

export class InMemoryRedisStub {
  private store = new Map<string, unknown>()
  private ttls = new Map<string, number>()

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.store.set(key, value)
    if (ttl > 0) this.ttls.set(key, ttl)
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
    this.ttls.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async incr(key: string): Promise<number> {
    const current = (this.store.get(key) as number | undefined) ?? 0
    const next = current + 1
    this.store.set(key, next)
    return next
  }

  async ttl(key: string): Promise<number> {
    return this.ttls.get(key) ?? -1
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.store.has(key)) return false
    this.ttls.set(key, seconds)
    return true
  }

  async setNX(key: string, value: string, ttl: number): Promise<boolean> {
    if (this.store.has(key)) return false
    this.store.set(key, value)
    if (ttl > 0) this.ttls.set(key, ttl)
    return true
  }

  async execPipeline<T>(
    build: (pipe: ChainableCommander) => void
  ): Promise<Array<[Error | null, T]>> {
    const queued: Array<() => Promise<unknown>> = []

    const pipe = {
      get: (key: string) => {
        queued.push(async () => this.store.get(key) ?? null)
        return pipe
      },
      set: (key: string, value: unknown) => {
        queued.push(async () => {
          this.store.set(key, value)
          return 'OK'
        })
        return pipe
      },
      setex: (key: string, seconds: number, value: unknown) => {
        queued.push(async () => {
          this.store.set(key, value)
          this.ttls.set(key, seconds)
          return 'OK'
        })
        return pipe
      },
      del: (key: string) => {
        queued.push(async () => {
          const existed = this.store.delete(key)
          this.ttls.delete(key)
          return existed ? 1 : 0
        })
        return pipe
      },
    } as unknown as ChainableCommander

    build(pipe)

    const results: Array<[Error | null, T]> = []
    for (const op of queued) {
      try {
        const value = (await op()) as T
        results.push([null, value])
      } catch (err) {
        results.push([err as Error, undefined as unknown as T])
      }
    }
    return results
  }

  has(key: string): boolean {
    return this.store.has(key)
  }

  raw(key: string): unknown {
    return this.store.get(key)
  }

  keys(): string[] {
    return [...this.store.keys()]
  }

  reset(): void {
    this.store.clear()
    this.ttls.clear()
  }
}
