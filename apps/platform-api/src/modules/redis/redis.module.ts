import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { STAFF_REDIS } from './redis.constants'

/**
 * Redis for staff-side features. By default it connects to the same (main)
 * Redis server the rest of the platform uses - sharing the *server* is fine
 * because staff data is isolated by the `staff:` key prefix (see the stores),
 * so keys can never collide with or be read as customer keys. Set
 * STAFF_REDIS_URL to point at a dedicated instance if you split them later.
 * Errors are swallowed so a Redis outage degrades gracefully (callers fail open).
 */
@Global()
@Module({
  providers: [
    {
      provide: STAFF_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('STAFF_REDIS_URL')
        const client = url
          ? new Redis(url, { maxRetriesPerRequest: 1 })
          : new Redis({
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
              password: config.get<string>('REDIS_PASSWORD'),
              db: config.get<number>('REDIS_DB', 0),
              maxRetriesPerRequest: 1,
            })
        client.on('error', () => {
          /* fail-open: store methods catch and degrade */
        })
        return client
      },
    },
  ],
  exports: [STAFF_REDIS],
})
export class StaffRedisModule {}
