import { createHash } from 'crypto'
import { generateDeviceFingerprint } from '@rufieltics/auth-core'

/** sha256 of the per-session device secret (stored client-side as an httpOnly cookie). */
export function hashDeviceSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

/**
 * Environment binding hash: `sha256(id:browser:os)`. Geo/IP are intentionally
 * excluded so roaming/VPN don't force re-login (see auth-core fingerprint).
 */
export function computeEnvHash(
  id: string | number,
  userAgent = '',
  ip = ''
): string {
  return generateDeviceFingerprint(id, userAgent, ip).hash
}

export interface DeviceBindingClaims {
  /** hash of the device secret */
  fph: string
  /** environment (browser/os) hash */
  env: string
}

export interface DeviceBindingContext {
  id: string | number
  deviceSecret?: string | null
  userAgent?: string | null
  ip?: string | null
}

/**
 * Verify a token's binding claims against the live request: the device secret
 * cookie must hash to `fph` and the current browser/os must hash to `env`.
 * Both must match, or the token is considered stolen/replayed.
 */
export function verifyDeviceBinding(
  claims: DeviceBindingClaims,
  ctx: DeviceBindingContext
): boolean {
  if (!ctx.deviceSecret) return false
  if (hashDeviceSecret(ctx.deviceSecret) !== claims.fph) return false
  const env = computeEnvHash(ctx.id, ctx.userAgent ?? '', ctx.ip ?? '')
  return env === claims.env
}
