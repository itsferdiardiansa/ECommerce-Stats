export function formatRemainingTime(milliseconds: number): {
  minutes: number
  seconds: number
} {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return { minutes, seconds }
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
