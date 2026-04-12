export type RemainingTime =
  | { range: 'seconds'; seconds: number }
  | { range: 'minutes'; minutes: number; seconds: number }
  | { range: 'hours'; hours: number; minutes: number; seconds: number }
  | { range: 'days'; days: number; hours: number; minutes: number }
  | { range: 'weeks'; weeks: number; days: number; hours: number }

/**
 * Break a remaining duration into named time components.
 *
 * Rules:
 *  - < 60 s   → { range: 'seconds', seconds }
 *  - < 1 h    → { range: 'minutes', minutes, seconds }
 *  - < 24 h   → { range: 'hours',   hours, minutes, seconds }
 *  - < 7 d    → { range: 'days',    days, hours, minutes }
 *  - >= 7 d   → { range: 'weeks',   weeks, days, hours }
 *
 * Callers pass the result as i18n args so each locale composes the string
 * with its own words (e.g. "jam", "menit" in Indonesian).
 */
export function formatRemainingTime(milliseconds: number): RemainingTime {
  const totalSeconds = Math.ceil(milliseconds / 1000)

  const weeks = Math.floor(totalSeconds / (7 * 24 * 3600))
  const days = Math.floor((totalSeconds % (7 * 24 * 3600)) / (24 * 3600))
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (totalSeconds < 60) {
    return { range: 'seconds', seconds }
  }
  if (totalSeconds < 3600) {
    return { range: 'minutes', minutes, seconds }
  }
  if (totalSeconds < 86400) {
    return { range: 'hours', hours, minutes, seconds }
  }
  if (totalSeconds < 7 * 86400) {
    return { range: 'days', days, hours, minutes }
  }
  return { range: 'weeks', weeks, days, hours }
}

/**
 * Parse a duration string like "5m", "7d", "3600s" into seconds.
 * Supported units: s (seconds), m (minutes), h (hours), d (days).
 * Falls back to 900s (15 minutes) if the format is invalid.
 */
export function parseExpiresIn(raw: string): number {
  const match = raw.match(/^(\d+)([smhd])$/)
  if (!match) return 900
  const value = parseInt(match[1], 10)
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return value * (multipliers[match[2]] ?? 60)
}
