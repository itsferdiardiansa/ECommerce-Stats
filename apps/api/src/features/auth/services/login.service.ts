import { Injectable, UnauthorizedException } from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import { EventEmitter2 } from '@nestjs/event-emitter'
import * as argon2 from 'argon2'
import { randomBytes, randomUUID } from 'crypto'
import {
  getUserByEmail,
  getSessionUser,
} from '@rufieltics/db/domains/identity/user'
import { OrganizationMembers } from '@rufieltics/db/domains/identity/organization'
import { Totp } from '@rufieltics/db/domains/auth'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { LoginAnomalyService, RiskSignal } from './login-anomaly.service'
import { PasskeyService } from './passkey.service'
import { TrustedDeviceService } from './trusted-device.service'
import { StepUpService } from './step-up.service'
import { AuthService } from '../auth.service'
import { generateDeviceFingerprint } from '@/utils/fingerprint'
import { pickPrimaryMembership } from '@/utils/auth'
import { Prisma } from '@rufieltics/db'
import { AUTH_EVENTS, LoginSuccessEvent, LoginFailedEvent } from '../events'
import type { LoginDto } from '../dto/login.dto'

@Injectable()
export class LoginService {
  constructor(
    private readonly authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
    private readonly anomaly: LoginAnomalyService,
    private readonly passkeyService: PasskeyService,
    private readonly trustedDevices: TrustedDeviceService,
    private readonly stepUp: StepUpService
  ) {}

  private dummyPasswordHash: string | null = null

  /**
   * A throwaway argon2 hash used to verify against when no user is found, so a
   * login attempt for a non-existent email costs the same time as one for a
   * real account — closing the timing side-channel that would otherwise reveal
   * whether an email is registered. Computed once and cached.
   */
  private async getDummyPasswordHash(): Promise<string> {
    if (!this.dummyPasswordHash) {
      this.dummyPasswordHash = await argon2.hash(
        randomBytes(32).toString('hex')
      )
    }
    return this.dummyPasswordHash
  }

  async login(
    data: LoginDto,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    trustedDeviceToken?: string,
    reuseDeviceSecret?: string
  ) {
    const user = await getUserByEmail(data.email)

    // Always run a hash verification (against a dummy hash when the user is
    // missing) so response time doesn't reveal whether the email exists, and
    // return one generic message for both "no such email" and "wrong password".
    const passwordHash =
      user?.passwordHash ?? (await this.getDummyPasswordHash())
    const isPasswordValid = await argon2.verify(passwordHash, data.password)

    if (!user || !isPasswordValid) {
      this.eventEmitter.emit(
        AUTH_EVENTS.LOGIN_FAILED,
        new LoginFailedEvent(
          user
            ? Prisma.LoginReason.INVALID_PASSWORD
            : Prisma.LoginReason.USER_NOT_FOUND,
          data.email,
          ipAddress || null,
          userAgent || null,
          user?.id ?? null
        )
      )
      throw new UnauthorizedException(i18n.t('auth.errors.invalid_credentials'))
    }

    if (user.lockedAt) {
      throw new UnauthorizedException(i18n.t('auth.errors.account_frozen'))
    }

    if (!user.isActive) {
      this.eventEmitter.emit(
        AUTH_EVENTS.LOGIN_FAILED,
        new LoginFailedEvent(
          Prisma.LoginReason.EMAIL_NOT_VERIFIED,
          data.email,
          ipAddress || null,
          userAgent || null,
          user.id
        )
      )
      throw new UnauthorizedException(
        i18n.t('auth.errors.account_not_verified')
      )
    }

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const role = primary?.role ?? null
    const orgId = primary?.organizationId ?? null

    const { hash: fingerprint, geo: previewGeo } = generateDeviceFingerprint(
      user.id,
      userAgent,
      ipAddress
    )
    const trusted = await this.trustedDevices.verify(
      user.id,
      trustedDeviceToken,
      fingerprint
    )
    const risk = await this.anomaly.previewSuccessRisk({
      userId: user.id,
      deviceFingerprint: fingerprint,
      country: previewGeo.country,
      latitude: previewGeo.latitude,
      longitude: previewGeo.longitude,
    })

    const [hasTotp, passkeyCount] = await Promise.all([
      Totp.findConfirmed(user.id).then(t => t !== null),
      this.passkeyService.count(user.id),
    ])
    const hasPasskey = passkeyCount > 0

    if (this.shouldChallenge(hasTotp || hasPasskey, trusted, risk)) {
      return this.stepUp.initiateStepUp(
        user,
        role,
        orgId,
        i18n.lang,
        hasTotp,
        hasPasskey,
        userAgent,
        ipAddress
      )
    }

    const {
      geo,
      deviceFingerprint,
      jti: _jti,
      ...session
    } = await this.authService.initiateSession(
      user,
      role,
      orgId,
      userAgent,
      ipAddress,
      reuseDeviceSecret
    )

    this.eventEmitter.emit(
      AUTH_EVENTS.LOGIN_SUCCESS,
      new LoginSuccessEvent(
        user.id,
        ipAddress || null,
        userAgent || null,
        deviceFingerprint,
        geo
      )
    )

    return session
  }

  private shouldChallenge(
    has2fa: boolean,
    trusted: boolean,
    risk: RiskSignal[]
  ): boolean {
    if (risk.includes(RiskSignal.IMPOSSIBLE_TRAVEL)) return true
    if (trusted) return false
    if (has2fa) return true

    return risk.length > 0
  }

  /** Passwordless: issues discoverable-credential options for conditional UI. */
  async beginPasskeyDiscovery() {
    const challengeId = randomUUID()
    const options =
      await this.passkeyService.beginDiscoverableAuthentication(challengeId)
    return { challengeId, options }
  }

  /** Passwordless: verifies the assertion and issues a session directly (no password). */
  async finishPasskeyDiscovery(
    challengeId: string,
    response: AuthenticationResponseJSON,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    reuseDeviceSecret?: string
  ) {
    const userId = await this.passkeyService.finishDiscoverableAuthentication(
      challengeId,
      response,
      userAgent
    )
    const user = userId ? await getSessionUser(userId) : null
    if (!user) {
      throw new UnauthorizedException(
        i18n.t('auth.errors.passkey_login_failed')
      )
    }

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const {
      geo,
      deviceFingerprint,
      jti: _jti,
      ...session
    } = await this.authService.initiateSession(
      user,
      primary?.role ?? null,
      primary?.organizationId ?? null,
      userAgent,
      ipAddress,
      reuseDeviceSecret
    )

    this.eventEmitter.emit(
      AUTH_EVENTS.LOGIN_SUCCESS,
      new LoginSuccessEvent(
        user.id,
        ipAddress || null,
        userAgent || null,
        deviceFingerprint,
        geo
      )
    )

    return session
  }
}
