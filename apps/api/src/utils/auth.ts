import { randomUUID, randomInt, randomBytes, createHash } from 'crypto'

export const ROLE_PRIORITY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  ANALYST: 2,
  VIEWER: 1,
}

export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString()
}

/** Recovery code shown once at enrolment, e.g. "3F9K-2QX7-M4TD". */
export function generateRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(12)
  const chars = Array.from(bytes, b => alphabet[b % alphabet.length])
  return [
    chars.slice(0, 4).join(''),
    chars.slice(4, 8).join(''),
    chars.slice(8, 12).join(''),
  ].join('-')
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/** High-entropy opaque token stored in the trusted-device cookie. */
export function generateTrustedDeviceToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * SHA-256 of a trusted-device token for storage/lookup. Fast hashing is correct
 * here — the token is already high-entropy random, unlike a password.
 */
export function hashTrustedDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOrgSlug(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const suffix = randomUUID().slice(0, 8)
  return `${base}-${suffix}`
}

export function generatePasswordResetToken(): {
  token: string
  tokenHash: string
} {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOAuthUsername(email: string): string {
  const base =
    email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'user'
  return `${base}-${randomUUID().slice(0, 8)}`
}

export function pickPrimaryMembership(
  memberships: Array<{ organizationId: string; role: string; joinedAt: Date }>
) {
  if (memberships.length === 0) return null
  return memberships.reduce((best, current) => {
    const bestPrio = ROLE_PRIORITY[best.role] ?? 0
    const currPrio = ROLE_PRIORITY[current.role] ?? 0
    if (currPrio > bestPrio) return current
    if (currPrio === bestPrio && current.joinedAt > best.joinedAt)
      return current
    return best
  })
}
