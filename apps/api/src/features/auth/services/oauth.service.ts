import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { I18nContext } from 'nestjs-i18n'
import {
  Google,
  decodeIdToken,
  generateCodeVerifier,
  generateState,
} from 'arctic'
import {
  createUser,
  getUserByEmail,
  getSessionUser,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import { OAuthAccounts } from '@rufieltics/db/domains/auth'
import { OrganizationMembers } from '@rufieltics/db/domains/identity/organization'
import { Prisma } from '@rufieltics/db'
import { AuthService } from '../auth.service'
import { OAuthStateStore } from '@/modules/redis/stores'
import { AUTH_EVENTS, LoginSuccessEvent, LoginFailedEvent } from '../events'
import { pickPrimaryMembership, generateOAuthUsername } from '@/utils/auth'
import { provisionPersonalWorkspace } from '@/utils/workspace'

const GOOGLE_PROVIDER = 'google'
const GOOGLE_SCOPES = ['openid', 'profile', 'email']

interface GoogleIdTokenClaims {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  aud?: string
  iss?: string
  exp?: number
}

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

type TrustedGoogleClaims = GoogleIdTokenClaims & { sub: string; email: string }

type SessionUser = { id: number; email: string; isStaff: boolean }

@Injectable()
export class OAuthService {
  private readonly google: Google | null
  private readonly clientId: string
  private readonly stateTtl: number

  constructor(
    private readonly authService: AuthService,
    private readonly oauthStateStore: OAuthStateStore,
    private readonly eventEmitter: EventEmitter2,
    config: ConfigService
  ) {
    const clientId = config.get<string>('security.oauth.google.clientId', '')
    const clientSecret = config.get<string>(
      'security.oauth.google.clientSecret',
      ''
    )
    const redirectUri = config.get<string>(
      'security.oauth.google.redirectUri',
      ''
    )
    this.clientId = clientId
    this.google =
      clientId && clientSecret && redirectUri
        ? new Google(clientId, clientSecret, redirectUri)
        : null
    this.stateTtl = config.get<number>('security.oauth.stateTtlSeconds', 600)
  }

  isGoogleEnabled(): boolean {
    return this.google !== null
  }

  async createGoogleAuthUrl(
    i18n: I18nContext
  ): Promise<{ url: string; state: string }> {
    if (!this.google) {
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_disabled'))
    }
    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    await this.oauthStateStore.set(
      GOOGLE_PROVIDER,
      state,
      { codeVerifier },
      this.stateTtl
    )
    const url = this.google
      .createAuthorizationURL(state, codeVerifier, GOOGLE_SCOPES)
      .toString()
    return { url, state }
  }

  async handleGoogleCallback(
    code: string,
    state: string,
    cookieState: string | undefined,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string,
    reuseDeviceSecret?: string
  ) {
    if (!this.google) {
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_disabled'))
    }

    if (!cookieState || cookieState !== state) {
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_failed'))
    }

    const stored = await this.oauthStateStore.get(GOOGLE_PROVIDER, state)
    if (!stored) {
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_failed'))
    }
    await this.oauthStateStore.delete(GOOGLE_PROVIDER, state)

    const tokens = await this.google
      .validateAuthorizationCode(code, stored.codeVerifier)
      .catch(() => null)
    if (!tokens) {
      this.emitFailure(null, ipAddress, userAgent)
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_failed'))
    }

    const claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims
    if (!this.isTrustedClaims(claims)) {
      this.emitFailure(claims.email ?? null, ipAddress, userAgent)
      throw new UnauthorizedException(i18n.t('auth.errors.oauth_failed'))
    }

    const user = await this.resolveUser(claims, i18n, ipAddress, userAgent)

    const memberships = await OrganizationMembers.listByUser(user.id)
    const primary = pickPrimaryMembership(memberships)

    const { geo, deviceFingerprint, ...session } =
      await this.authService.initiateSession(
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

  private isTrustedClaims(
    claims: GoogleIdTokenClaims
  ): claims is TrustedGoogleClaims {
    if (!claims.sub || !claims.email) return false
    if (this.clientId && claims.aud !== this.clientId) return false
    if (!claims.iss || !GOOGLE_ISSUERS.includes(claims.iss)) return false
    if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) {
      return false
    }
    return true
  }

  private async resolveUser(
    claims: TrustedGoogleClaims,
    i18n: I18nContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionUser> {
    const email = claims.email.toLowerCase()
    const account = await OAuthAccounts.findByProvider(
      GOOGLE_PROVIDER,
      claims.sub
    )

    if (account) {
      const user = await getSessionUser(account.userId)
      if (!user || !user.isActive) {
        this.emitFailure(email, ipAddress, userAgent)
        throw new UnauthorizedException(
          i18n.t('auth.errors.oauth_account_unavailable')
        )
      }
      return { id: user.id, email: user.email, isStaff: user.isStaff }
    }

    if (claims.email_verified !== true) {
      this.emitFailure(email, ipAddress, userAgent)
      throw new UnauthorizedException(
        i18n.t('auth.errors.oauth_email_not_verified')
      )
    }

    const existing = await getUserByEmail(email)

    if (existing) {
      await OAuthAccounts.create(this.buildAccount(existing.id, claims.sub))
      if (!existing.emailVerifiedAt) {
        await updateUser(existing.id, {
          isActive: true,
          emailVerifiedAt: new Date(),
          passwordHash: null,
        })
      } else if (!existing.isActive) {
        await updateUser(existing.id, { isActive: true })
      }
      return {
        id: existing.id,
        email: existing.email,
        isStaff: existing.isStaff,
      }
    }

    const created = await createUser({
      email,
      username: generateOAuthUsername(email),
      name: claims.name || email.split('@')[0],
      avatar: claims.picture ?? null,
      isActive: true,
      emailVerifiedAt: new Date(),
    })
    await OAuthAccounts.create(this.buildAccount(created.id, claims.sub))
    await provisionPersonalWorkspace(created.id, created.name, created.username)

    return { id: created.id, email: created.email, isStaff: created.isStaff }
  }

  private buildAccount(userId: number, providerAccountId: string) {
    return {
      userId,
      type: 'oidc',
      provider: GOOGLE_PROVIDER,
      providerAccountId,
      scope: GOOGLE_SCOPES.join(' '),
    }
  }

  private emitFailure(
    email: string | null,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.eventEmitter.emit(
      AUTH_EVENTS.LOGIN_FAILED,
      new LoginFailedEvent(
        Prisma.LoginReason.OAUTH_ERROR,
        email ?? '',
        ipAddress || null,
        userAgent || null,
        null
      )
    )
  }
}
