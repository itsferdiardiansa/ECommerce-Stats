export const NOTIFICATIONS_QUEUE = 'security-notifications'

export enum SecurityNotificationKind {
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  SESSION_COMPROMISE = 'SESSION_COMPROMISE',
  // Step-up challenge cleared: a new device signed in after OTP verification.
  NEW_SIGN_IN = 'NEW_SIGN_IN',
  // Step-up challenge failed/voided: correct password, but OTP not passed.
  STEP_UP_BLOCKED = 'STEP_UP_BLOCKED',
}

/**
 * The delivery *intent* placed on the queue. The worker resolves the recipient,
 * checks the user's preference, and renders the email — keeping those DB reads
 * off the request-adjacent path. Deduplication happens before enqueue.
 */
export interface SecurityNotificationJob {
  userId: number
  kind: SecurityNotificationKind
  signals: string[]
  context: {
    ipAddress: string | null
    country: string | null
  }
}
