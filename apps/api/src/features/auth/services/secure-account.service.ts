import { Injectable, BadRequestException } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import {
  getUserCredentials,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import { SecureAccountStore } from '@/modules/redis/stores'
import { AuthService } from '../auth.service'
import { PasswordResetService } from './password-reset.service'

export type SecureTokenState = 'valid' | 'already_secured' | 'invalid'

@Injectable()
export class SecureAccountService {
  constructor(
    private readonly secureStore: SecureAccountStore,
    private readonly authService: AuthService,
    private readonly passwordReset: PasswordResetService
  ) {}

  /** Non-consuming state check for the SSR page load. */
  async checkToken(token: string): Promise<SecureTokenState> {
    const stored = await this.secureStore.get(token)
    if (!stored) return 'invalid'
    const user = await getUserCredentials(stored.userId)
    if (!user) return 'invalid'
    if (this.recoveredSince(user.passwordChangedAt, stored.issuedAt)) {
      return 'invalid'
    }
    return user.lockedAt ? 'already_secured' : 'valid'
  }

  /**
   * Freezes the account behind a signed link from a security alert: locks it so
   * no factor can sign in, kills every active session, and emails a recovery
   * link. Idempotent -- a re-click on an already-locked account is a no-op, so
   * the link survives a browser restart. The token is not consumed; it lapses
   * on its own TTL, and a later password reset invalidates it via `issuedAt`.
   */
  async secureAccount(token: string, i18n: I18nContext): Promise<void> {
    const stored = await this.secureStore.get(token)
    if (!stored) {
      throw new BadRequestException(i18n.t('auth.errors.secure_token_invalid'))
    }

    const user = await getUserCredentials(stored.userId)
    if (!user || this.recoveredSince(user.passwordChangedAt, stored.issuedAt)) {
      throw new BadRequestException(i18n.t('auth.errors.secure_token_invalid'))
    }

    if (user.lockedAt) return

    await updateUser(user.id, { lockedAt: new Date() })
    await this.authService.revokeAllSessions(user.id)
    await this.passwordReset.forgotPassword(user.email, i18n)
  }

  /** A password change after the link was minted means the user already recovered. */
  private recoveredSince(
    passwordChangedAt: Date | null,
    issuedAt?: number
  ): boolean {
    return (
      !!passwordChangedAt &&
      !!issuedAt &&
      passwordChangedAt.getTime() > issuedAt
    )
  }
}
