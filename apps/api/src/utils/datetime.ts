export function formatRemainingTime(milliseconds: number): {
  minutes: number
  seconds: number
} {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return { minutes, seconds }
}
