import type { Prisma } from '@rufieltics/db'

export class LoginFailedEvent {
  constructor(
    public readonly reason: Prisma.LoginReason,
    public readonly attemptedEmail: string,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    // Null when the email does not resolve to an account (USER_NOT_FOUND).
    public readonly userId: number | null
  ) {}
}
