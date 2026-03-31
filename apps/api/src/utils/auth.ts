import { randomUUID, randomInt } from 'crypto'

export const ROLE_PRIORITY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  ANALYST: 2,
  VIEWER: 1,
}

export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString()
}

export function generateOrgSlug(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const suffix = randomUUID().slice(0, 8)
  return `${base}-${suffix}`
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
