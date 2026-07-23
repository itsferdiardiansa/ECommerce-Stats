import { createHash } from 'crypto'
import geoip from 'geoip-lite'
import { UAParser } from 'ua-parser-js'

export interface GeoLocation {
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

export interface FingerprintResult {
  hash: string
  geo: GeoLocation
  device: {
    browser: string | null
    os: string | null
  }
}

export function generateDeviceFingerprint(
  userId: number,
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  userAgentString: string = '',
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  ipAddress: string = ''
): FingerprintResult {
  const ua = new UAParser(userAgentString).getResult()
  const browser = ua.browser.name || 'Unknown'
  const os = ua.os.name || 'Unknown'

  const geo = geoip.lookup(ipAddress) || null

  const lat = geo && geo.ll ? geo.ll[0] : null
  const lng = geo && geo.ll ? geo.ll[1] : null
  const country = geo ? geo.country : 'Unknown'
  const region = geo ? geo.region : 'Unknown'
  const city = geo ? geo.city : 'Unknown'

  // Geo (country/region) is intentionally excluded from the enforced
  // fingerprint: it is derived from the request IP, which legitimately changes
  // for mobile/roaming/VPN users and would otherwise force a re-login or revoke
  // the session on every network switch. Geo is still returned below for
  // logging and anomaly alerting.
  const rawFingerprint = `${userId}:${browser}:${os}`
  const hash = createHash('sha256').update(rawFingerprint).digest('hex')

  return {
    hash,
    geo: {
      country: country !== 'Unknown' ? country : null,
      region: region !== 'Unknown' ? region : null,
      city: city !== 'Unknown' ? city : null,
      latitude: lat,
      longitude: lng,
    },
    device: {
      browser: browser !== 'Unknown' ? browser : null,
      os: os !== 'Unknown' ? os : null,
    },
  }
}
