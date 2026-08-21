export function percentOf(
  part: number | null | undefined,
  whole: number
): number {
  if (part === null || part === undefined || whole <= 0) return 0
  return Math.round((part / whole) * 100)
}
