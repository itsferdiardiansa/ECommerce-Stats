import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import geoip from 'geoip-lite'
import { RedisService } from '@/modules/redis/redis.service'
import { formatLocation } from '@/utils/fingerprint'

/**
 * Resolves an IP to a human "City, Region, Country". Uses ipinfo.io when
 * IPINFO_TOKEN is set (richer city/region data), otherwise the local geoip-lite
 * DB (country-level, offline, free). Results are Redis-cached per IP, and it is
 * only called off the request path (notification worker), so the external call
 * never affects auth latency.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name)
  private readonly ipinfoToken?: string
  private readonly cacheTtlSeconds = 86400

  constructor(
    private readonly redis: RedisService,
    config: ConfigService
  ) {
    this.ipinfoToken = config.get<string>('geo.ipinfoToken') || undefined
  }

  async resolveLocation(ip: string | null): Promise<string | null> {
    if (!ip) return null

    const cacheKey = `geo:loc:${ip}`
    const cached = await this.redis.get<string>(cacheKey)
    if (cached !== null) return cached || null

    let location: string | null = null
    if (this.ipinfoToken) location = await this.lookupIpinfo(ip)
    if (!location) location = this.lookupLocal(ip)

    await this.redis.set(cacheKey, location ?? '', this.cacheTtlSeconds)
    return location
  }

  private lookupLocal(ip: string): string | null {
    const geo = geoip.lookup(ip)
    if (!geo) return null
    return formatLocation({
      city: geo.city,
      region: geo.region,
      country: geo.country,
    })
  }

  private async lookupIpinfo(ip: string): Promise<string | null> {
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${this.ipinfoToken}`,
        { signal: AbortSignal.timeout(3000) }
      )
      if (!res.ok) return null
      const data = (await res.json()) as {
        city?: string
        region?: string
        country?: string
        bogon?: boolean
      }
      if (data.bogon) return null
      return formatLocation(data)
    } catch (error) {
      this.logger.warn(`ipinfo lookup failed for ${ip}: ${error}`)
      return null
    }
  }
}
