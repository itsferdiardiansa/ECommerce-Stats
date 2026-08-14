export function digitsOnly(value: string, max?: number): string {
  const digits = value.replace(/\D/g, '')
  return max ? digits.slice(0, max) : digits
}

export function recoveryCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

export function phoneChars(value: string): string {
  return value.replace(/[^\d+\s()-]/g, '').slice(0, 20)
}
