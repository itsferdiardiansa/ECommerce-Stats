import type { ActivityEntry } from '@/features/account/api/account.api'

export const ACTIVITY_REASONS: Record<string, string> = {
  INVALID_PASSWORD: 'Wrong password',
  USER_NOT_FOUND: 'Unknown account',
  ACCOUNT_LOCKED: 'Account locked',
  ACCOUNT_DISABLED: 'Account disabled',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  TWO_FACTOR_REQUIRED: 'Two-factor required',
  TWO_FACTOR_INVALID: 'Wrong two-factor code',
  RECOVERY_CODE_INVALID: 'Wrong recovery code',
  OAUTH_ERROR: 'Google sign-in failed',
  IP_RESTRICTED: 'Blocked location',
  UNKNOWN_ERROR: 'Sign-in failed',
}

export function activityLabel(e: ActivityEntry): string {
  if (e.isSuccess) return 'Signed in'
  return (e.reason && ACTIVITY_REASONS[e.reason]) || 'Sign-in failed'
}

export function activityTitle(e: ActivityEntry): string {
  const os = e.os ?? 'an unknown device'
  return e.isSuccess ? `Recent login on ${os}` : `${activityLabel(e)} on ${os}`
}

export function activitySubtitle(e: ActivityEntry): string {
  return (
    [e.device, e.location, e.ipAddress].filter(Boolean).join(' · ') ||
    'Unknown device'
  )
}
