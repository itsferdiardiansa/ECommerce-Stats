/**
 * Masks the middle of an account or phone number, keeping the leading and
 * trailing digits so it stays recognisable ("0812****8842", "****4242").
 */
export function maskAccount(value: string): string {
  const clean = value.replace(/[\s-]/g, '')
  if (clean.length <= 4) return '*'.repeat(clean.length)
  if (clean.length <= 8)
    return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`
  return `${clean.slice(0, 4)}${'*'.repeat(4)}${clean.slice(-4)}`
}
