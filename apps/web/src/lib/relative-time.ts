export function relativeTime(iso: string): string {
  const date = new Date(iso)
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
