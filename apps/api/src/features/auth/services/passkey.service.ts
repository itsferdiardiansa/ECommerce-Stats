import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nContext } from 'nestjs-i18n'
import { randomBytes } from 'crypto'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { Passkeys } from '@rufieltics/db/domains/auth'
import { getUserCredentials } from '@rufieltics/db/domains/identity/user'
import { WebauthnStore } from '@/modules/redis/stores'

interface RegChallenge {
  challenge: string
  userHandle: string
}
interface AuthChallenge {
  challenge: string
  userId: number
}
interface DiscoverChallenge {
  challenge: string
}

const toB64Url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64url')
const fromB64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const buf = Buffer.from(value, 'base64url')
  const out = new Uint8Array(buf.byteLength)
  out.set(buf)
  return out
}

/** WebAuthn engine: runs the registration and authentication ceremonies. */
@Injectable()
export class PasskeyService {
  private readonly rpId: string
  private readonly rpName: string
  private readonly origins: string[]
  private readonly challengeTtl: number

  constructor(
    private readonly webauthnStore: WebauthnStore,
    config: ConfigService
  ) {
    this.rpId = config.get<string>('security.webauthn.rpId', 'localhost')
    this.rpName = config.get<string>('security.webauthn.rpName', 'Rufieltics')
    this.origins = config.get<string[]>('security.webauthn.origins', [])
    this.challengeTtl = config.get<number>(
      'security.webauthn.challengeTtlSeconds',
      120
    )
  }

  async beginRegistration(userId: number, i18n: I18nContext) {
    const user = await getUserCredentials(userId)
    if (!user) {
      throw new NotFoundException(i18n.t('users.errors.user_not_found'))
    }

    const existing = await Passkeys.listByUser(userId)
    const userHandle = existing[0]?.userHandle ?? toB64Url(randomBytes(32))

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName: user.email,
      userDisplayName: user.name ?? user.email,
      userID: fromB64Url(userHandle),
      attestationType: 'none',
      excludeCredentials: existing.map(p => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        // Discoverable credential required so it can be offered for passwordless
        // (conditional UI) login without the user typing an identifier first.
        residentKey: 'required',
        userVerification: 'required',
      },
    })

    await this.webauthnStore.setChallenge(
      'reg',
      userId,
      { challenge: options.challenge, userHandle } satisfies RegChallenge,
      this.challengeTtl
    )

    return options
  }

  async finishRegistration(
    userId: number,
    response: RegistrationResponseJSON,
    i18n: I18nContext,
    name?: string
  ) {
    const pending = await this.webauthnStore.getChallenge<RegChallenge>(
      'reg',
      userId
    )
    if (!pending) {
      throw new BadRequestException(i18n.t('auth.mfa.passkey.not_started'))
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: this.origins,
      expectedRPID: this.rpId,
      requireUserVerification: true,
    }).catch(() => null)

    if (!verification?.verified || !verification.registrationInfo) {
      throw new BadRequestException(i18n.t('auth.mfa.passkey.invalid'))
    }

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo

    const passkey = await Passkeys.create({
      userId,
      credentialId: credential.id,
      publicKey: toB64Url(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: response.response.transports ?? [],
      userHandle: pending.userHandle,
      aaguid: aaguid || null,
      name: name?.trim() || null,
    })

    await this.webauthnStore.deleteChallenge('reg', userId)
    return passkey
  }

  /** Issues assertion options for a user known to hold ≥1 passkey. */
  async beginAuthentication(
    scope: string,
    id: string | number,
    userId: number
  ) {
    const passkeys = await Passkeys.listByUser(userId)
    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      userVerification: 'required',
      allowCredentials: passkeys.map(p => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransportFuture[],
      })),
    })

    await this.webauthnStore.setChallenge(
      scope,
      id,
      { challenge: options.challenge, userId } satisfies AuthChallenge,
      this.challengeTtl
    )

    return options
  }

  /**
   * Verifies an assertion against the stored challenge. Returns the verified
   * userId on success, null otherwise. The library handles counter-regression
   * (and skips the check when the counter stays 0, normal for synced passkeys).
   */
  async finishAuthentication(
    scope: string,
    id: string | number,
    response: AuthenticationResponseJSON
  ): Promise<number | null> {
    const pending = await this.webauthnStore.getChallenge<AuthChallenge>(
      scope,
      id
    )
    if (!pending) return null

    const passkey = await Passkeys.findByCredentialId(response.id)
    if (!passkey || passkey.userId !== pending.userId) return null

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: this.origins,
      expectedRPID: this.rpId,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: fromB64Url(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    }).catch(() => null)

    if (!verification?.verified) return null

    await Passkeys.updateCounterAndUsed(
      passkey.credentialId,
      BigInt(verification.authenticationInfo.newCounter)
    )
    await this.webauthnStore.deleteChallenge(scope, id)
    return passkey.userId
  }

  /**
   * Passwordless (conditional UI) options: no user is known yet, so no
   * allowCredentials — the authenticator offers any resident credential. User
   * verification is required because the passkey is the sole factor.
   */
  async beginDiscoverableAuthentication(id: string) {
    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      userVerification: 'required',
      allowCredentials: [],
    })

    await this.webauthnStore.setChallenge(
      'discover',
      id,
      { challenge: options.challenge } satisfies DiscoverChallenge,
      this.challengeTtl
    )

    return options
  }

  /**
   * Verifies a passwordless assertion. The credentialId alone identifies the
   * user (it is unique), so no prior user context is needed. Returns the
   * verified userId, or null.
   */
  async finishDiscoverableAuthentication(
    id: string,
    response: AuthenticationResponseJSON
  ): Promise<number | null> {
    const pending = await this.webauthnStore.getChallenge<DiscoverChallenge>(
      'discover',
      id
    )
    if (!pending) return null

    const passkey = await Passkeys.findByCredentialId(response.id)
    if (!passkey) return null

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: this.origins,
      expectedRPID: this.rpId,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: fromB64Url(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    }).catch(() => null)

    if (!verification?.verified) return null

    await Passkeys.updateCounterAndUsed(
      passkey.credentialId,
      BigInt(verification.authenticationInfo.newCounter)
    )
    await this.webauthnStore.deleteChallenge('discover', id)
    return passkey.userId
  }

  async list(userId: number) {
    const passkeys = await Passkeys.listByUser(userId)
    return passkeys.map(p => ({
      id: p.id,
      name: p.name,
      deviceType: p.deviceType,
      backedUp: p.backedUp,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
    }))
  }

  async count(userId: number) {
    return Passkeys.countByUser(userId)
  }

  async rename(id: string, userId: number, name: string, i18n: I18nContext) {
    const { count } = await Passkeys.rename(id, userId, name.trim())
    if (count === 0) {
      throw new NotFoundException(i18n.t('auth.mfa.passkey.not_found'))
    }
  }

  async remove(id: string, userId: number, i18n: I18nContext) {
    const { count } = await Passkeys.deleteById(id, userId)
    if (count === 0) {
      throw new NotFoundException(i18n.t('auth.mfa.passkey.not_found'))
    }
  }
}
