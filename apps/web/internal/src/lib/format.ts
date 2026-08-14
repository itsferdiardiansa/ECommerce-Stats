export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '')
  return maxLength ? digits.slice(0, maxLength) : digits
}
