export const MAIL_QUEUE = 'mail'

/**
 * BullMQ job priority (lower = sooner). Interactive codes the user is waiting
 * on jump ahead of fire-and-forget notifications.
 */
export const MailPriority = {
  HIGH: 1, // OTP / verification / password reset - user is waiting
  NORMAL: 5, // security notifications, welcome, etc.
  LOW: 10,
} as const
