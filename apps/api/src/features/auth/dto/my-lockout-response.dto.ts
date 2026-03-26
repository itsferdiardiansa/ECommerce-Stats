export interface MyLockoutResponseDto {
  isLocked: boolean
  reason: string | null
  lockedAt: string | null
  expires: string | null
  remainingSeconds: number | null
  remainingMinutes: number | null
}
