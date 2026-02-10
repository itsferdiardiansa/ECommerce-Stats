export function normalizeName(name?: string): string | null {
  if (!name) return null
  const trimmed = name.trim()
  return trimmed || null
}

export function slugify(input: string, fallbackPrefix = 'item'): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `${fallbackPrefix}-${Date.now()}`
}

export function makeExternalUserData(userId: number) {
  const email = `external-order-${userId}@example.com`
  return {
    id: userId,
    email,
    username: `external_order_${userId}`,
    passwordHash: '',
    name: `External User ${userId}`,
    isActive: true,
  }
}
