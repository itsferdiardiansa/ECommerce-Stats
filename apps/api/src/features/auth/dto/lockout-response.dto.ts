export interface LockoutResponseDto {
  id: number
  email: string
  reason: string
  ipAddress: string | null
  userAgent: string | null
  lockedAt: string
  expires: string
  remainingSeconds: number | null
  clearedAt: string | null
  clearedBy: number | null
}

export interface LockoutListResponseDto {
  data: LockoutResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
