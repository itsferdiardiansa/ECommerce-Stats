import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import { randomUUID } from 'node:crypto'
import {
  StaffAccounts,
  StaffSessions,
  StaffTotps,
  StaffInvitations,
  getStaffPermissions,
} from '@rufieltics/db/domains/internal'
import {
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  buildOtpauthUri,
  verifyTotp,
} from '@rufieltics/auth-core'
import {
  LoginLockout,
  hashDeviceSecret,
  computeEnvHash,
} from '@rufieltics/auth-server'
import { StaffTokenService } from './staff-token.service'
import { MailService } from '../../modules/mail/mail.service'

interface RequestMeta {
  ip?: string
  userAgent?: string
}

const TOTP_RESET_EXPIRES_MINUTES = 30

@Injectable()
export class StaffAuthService {
  constructor(
    private readonly tokens: StaffTokenService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly lockout: LoginLockout
  ) {}

  private lockoutKey(email: string): string {
    return email.trim().toLowerCase()
  }

  private lockedMessage(
    i18n: I18nContext | undefined,
    retryAfterSeconds: number
  ): string {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
    return (
      (i18n?.t('staff.errors.too_many_attempts', {
        args: { minutes },
      }) as string) ?? 'staff.errors.too_many_attempts'
    )
  }

  private issuer(): string {
    return this.config.get<string>('STAFF_ISSUER', 'Rufieltics Admin')
  }

  private staffFromInvite(inviteToken: string) {
    try {
      return this.tokens.verifyInvite(inviteToken)
    } catch {
      throw new BadRequestException('staff.errors.invite_invalid')
    }
  }

  async setup(inviteToken: string, password: string) {
    const { sub } = this.staffFromInvite(inviteToken)
    const staff = await StaffAccounts.findById(sub)
    if (!staff || staff.status !== 'INVITED') {
      throw new BadRequestException('staff.errors.invite_used')
    }

    const passwordHash = await hashPassword(password)
    await StaffAccounts.update(staff.id, { passwordHash })

    const secret = generateTotpSecret()
    await StaffTotps.upsert(staff.id, secret)
    const otpauthUri = buildOtpauthUri(secret, staff.email, this.issuer())

    return { otpauthUri, secret }
  }

  async confirmSetup(inviteToken: string, code: string) {
    const { sub } = this.staffFromInvite(inviteToken)
    const staff = await StaffAccounts.findById(sub)
    if (!staff || staff.status !== 'INVITED') {
      throw new BadRequestException('staff.errors.invite_used')
    }

    const totp = await StaffTotps.findByStaff(staff.id)
    if (!totp || !verifyTotp(code, totp.secret)) {
      throw new BadRequestException('staff.errors.code_incorrect')
    }

    await StaffTotps.confirm(staff.id)
    await StaffAccounts.update(staff.id, { mfaEnabled: true, status: 'ACTIVE' })
    await StaffInvitations.markAcceptedByAccount(staff.id)
    return { activated: true }
  }

  async login(email: string, password: string, i18n?: I18nContext) {
    const key = this.lockoutKey(email)
    // Fail-open: a Redis outage must never block sign-in.
    const status = await this.lockout.status(key).catch(() => null)
    if (status?.locked) {
      throw new UnauthorizedException({
        message: this.lockedMessage(i18n, status.retryAfterSeconds),
        code: 'ACCOUNT_LOCKED',
      })
    }

    const staff = await StaffAccounts.findByEmail(email)
    const hash =
      staff?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    const valid = await verifyPassword(hash, password).catch(() => false)

    if (!staff || !valid || staff.status !== 'ACTIVE') {
      const after = await this.lockout.recordFailure(key).catch(() => null)
      if (after?.locked) {
        throw new UnauthorizedException({
          message: this.lockedMessage(i18n, after.retryAfterSeconds),
          code: 'ACCOUNT_LOCKED',
        })
      }
      const remaining = after?.remainingAttempts
      const message =
        remaining && remaining > 0
          ? ((i18n?.t('staff.errors.invalid_credentials_remaining', {
              args: { attempts: remaining },
            }) as string) ?? 'staff.errors.invalid_credentials')
          : 'staff.errors.invalid_credentials'
      throw new UnauthorizedException({ message, code: 'INVALID_CREDENTIALS' })
    }

    const mfaToken = this.tokens.signMfa(staff.id)
    const totp = await StaffTotps.findByStaff(staff.id)

    // No confirmed authenticator yet: hand back a fresh secret to enrol.
    if (!totp || !totp.confirmedAt) {
      const secret = generateTotpSecret()
      await StaffTotps.upsert(staff.id, secret)
      const otpauthUri = buildOtpauthUri(secret, staff.email, this.issuer())
      return {
        mfaRequired: true,
        enrollRequired: true,
        mfaToken,
        otpauthUri,
        secret,
      }
    }

    return { mfaRequired: true, enrollRequired: false, mfaToken }
  }

  async verifyMfa(mfaToken: string, code: string, meta: RequestMeta) {
    let sub: string
    try {
      sub = this.tokens.verifyMfa(mfaToken).sub
    } catch {
      throw new UnauthorizedException('staff.errors.mfa_expired')
    }

    const staff = await StaffAccounts.findById(sub)
    if (!staff || staff.status !== 'ACTIVE') {
      throw new UnauthorizedException('staff.errors.invalid_credentials')
    }
    const totp = await StaffTotps.findByStaff(staff.id)
    if (!totp || !verifyTotp(code, totp.secret)) {
      throw new UnauthorizedException('staff.errors.mfa_code_incorrect')
    }

    // Confirm the authenticator on first successful use (enrolment at login).
    if (!totp.confirmedAt) {
      await StaffTotps.confirm(staff.id)
      await StaffAccounts.update(staff.id, { mfaEnabled: true })
    } else {
      await StaffTotps.touch(staff.id)
    }
    // Full sign-in succeeded: clear the failed-attempt counter.
    await this.lockout
      .reset(this.lockoutKey(staff.email))
      .catch(() => undefined)
    return this.issueSession(staff.id, meta)
  }

  async requestTotpReset(email: string) {
    const staff = await StaffAccounts.findByEmail(email)
    if (staff && staff.status === 'ACTIVE') {
      const token = this.tokens.signTotpReset(staff.id)
      const url = `${this.config.get<string>(
        'PLATFORM_WEB_URL',
        'http://localhost:3001'
      )}/reset-totp?token=${token}`
      await this.mail.sendTotpReset({
        to: staff.email,
        name: staff.name ?? staff.email,
        url,
        expiresInMinutes: TOTP_RESET_EXPIRES_MINUTES,
      })
    }
    // Never reveal whether the email maps to an account.
    return { requested: true }
  }

  private staffFromReset(token: string) {
    try {
      return this.tokens.verifyTotpReset(token)
    } catch {
      throw new BadRequestException('staff.errors.reset_invalid')
    }
  }

  async beginTotpReset(token: string) {
    const { sub } = this.staffFromReset(token)
    const staff = await StaffAccounts.findById(sub)
    if (!staff || staff.status !== 'ACTIVE') {
      throw new BadRequestException('staff.errors.reset_invalid')
    }
    const secret = generateTotpSecret()
    await StaffTotps.upsert(staff.id, secret)
    const otpauthUri = buildOtpauthUri(secret, staff.email, this.issuer())
    return { otpauthUri, secret }
  }

  async confirmTotpReset(token: string, code: string) {
    const { sub } = this.staffFromReset(token)
    const staff = await StaffAccounts.findById(sub)
    if (!staff) {
      throw new BadRequestException('staff.errors.reset_invalid')
    }
    const totp = await StaffTotps.findByStaff(staff.id)
    if (!totp || !verifyTotp(code, totp.secret)) {
      throw new BadRequestException('staff.errors.code_incorrect')
    }
    await StaffTotps.confirm(staff.id)
    await StaffAccounts.update(staff.id, { mfaEnabled: true })
    // Force re-authentication everywhere after an authenticator reset.
    await StaffSessions.revokeAllForStaff(staff.id)
    return { reset: true }
  }

  private async issueSession(staffAccountId: string, meta: RequestMeta) {
    const jti = randomUUID()
    const refreshToken = this.tokens.signRefresh(staffAccountId, jti)
    const refreshTokenHash = await hashPassword(refreshToken)
    const expires = new Date(
      Date.now() + this.tokens.getRefreshExpiresIn() * 1000
    )

    await StaffSessions.create({
      staffAccountId,
      jti,
      refreshTokenHash,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      expires,
    })
    await StaffAccounts.update(staffAccountId, { lastLoginAt: new Date() })

    // Device binding: the token carries hashes of a fresh device secret (set as
    // an httpOnly cookie) and the browser/os, so a stolen token without the
    // cookie or from a different environment is rejected by the guard.
    const deviceSecret = randomUUID()
    const binding = {
      fph: hashDeviceSecret(deviceSecret),
      env: computeEnvHash(staffAccountId, meta.userAgent ?? ''),
    }

    return {
      accessToken: this.tokens.signAccess(staffAccountId, jti, binding),
      refreshToken,
      deviceSecret,
      expiresIn: this.tokens.getAccessExpiresIn(),
    }
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    let payload: { sub: string; jti: string }
    try {
      payload = this.tokens.verifyRefresh(refreshToken)
    } catch {
      throw new UnauthorizedException('staff.errors.refresh_invalid')
    }

    const session = await StaffSessions.findByJti(payload.jti)
    if (!session || session.isRevoked || session.expires <= new Date()) {
      throw new UnauthorizedException('staff.errors.session_expired')
    }
    const matches = await verifyPassword(
      session.refreshTokenHash,
      refreshToken
    ).catch(() => false)
    if (!matches) {
      throw new UnauthorizedException('staff.errors.refresh_invalid')
    }

    await StaffSessions.revokeByJti(payload.jti)
    return this.issueSession(session.staffAccountId, meta)
  }

  async logout(jti: string) {
    await StaffSessions.revokeByJti(jti).catch(() => undefined)
  }

  async me(staffAccountId: string) {
    const staff = await StaffAccounts.findById(staffAccountId)
    if (!staff) throw new UnauthorizedException()
    const permissions = await getStaffPermissions(staff.id)
    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      isSuperAdmin: staff.isSuperAdmin,
      status: staff.status,
      permissions,
    }
  }
}
