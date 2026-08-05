/**
 * Resolve an avatar value to a renderable src. Data URLs and same-origin paths
 * pass through; remote URLs (e.g. Google) are routed through our cached proxy so
 * the browser never hotlinks them (which Google rate-limits with 429s).
 */
export function avatarSrc(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('data:') || value.startsWith('/')) return value
  return `/api/avatar?u=${encodeURIComponent(value)}`
}
