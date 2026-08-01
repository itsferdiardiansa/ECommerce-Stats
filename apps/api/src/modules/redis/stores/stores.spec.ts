import type { RedisService } from '../redis.service'
import { VerificationStore } from './verification.store'
import { PasswordResetStore } from './password-reset.store'
import { EmailChangeStore } from './email-change.store'
import { StepUpStore } from './step-up.store'
import { WebauthnStore } from './webauthn.store'
import { OAuthStateStore } from './oauth-state.store'
import { TrustedDeviceStore } from './trusted-device.store'
import { SudoStore } from './sudo.store'
import { SessionStore } from './session.store'
import { MfaEnrolmentStore } from './mfa-enrolment.store'

const makeRedis = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  ttl: jest.fn(),
  expire: jest.fn(),
})

type MockRedis = ReturnType<typeof makeRedis>
const asRedis = (m: MockRedis) => m as unknown as RedisService

describe('VerificationStore', () => {
  let redis: MockRedis
  let store: VerificationStore
  beforeEach(() => {
    redis = makeRedis()
    store = new VerificationStore(asRedis(redis))
  })

  it('setCode writes the lowercased key and resets the attempt counter', async () => {
    await store.setCode('A@B.com', '123456', 300)
    expect(redis.set).toHaveBeenCalledWith(
      'verification:email:a@b.com',
      expect.objectContaining({ code: '123456' }),
      300
    )
    expect(redis.del).toHaveBeenCalledWith('verification:attempts:a@b.com')
  })

  it('incrementAttempts sets TTL only on the first attempt', async () => {
    redis.incr.mockResolvedValueOnce(1)
    redis.ttl.mockResolvedValueOnce(200)
    await store.incrementAttempts('a@b.com')
    expect(redis.expire).toHaveBeenCalledWith(
      'verification:attempts:a@b.com',
      200
    )

    redis.incr.mockResolvedValueOnce(2)
    await store.incrementAttempts('a@b.com')
    expect(redis.expire).toHaveBeenCalledTimes(1)
  })
})

describe('PasswordResetStore', () => {
  it('issue stores the token + user pointer and invalidates the previous token', async () => {
    const redis = makeRedis()
    redis.get.mockResolvedValueOnce('oldhash')
    const store = new PasswordResetStore(asRedis(redis))
    await store.issue(42, 'newhash', 900)
    expect(redis.del).toHaveBeenCalledWith('pwreset:token:oldhash')
    expect(redis.set).toHaveBeenCalledWith(
      'pwreset:token:newhash',
      { userId: 42 },
      900
    )
    expect(redis.set).toHaveBeenCalledWith('pwreset:user:42', 'newhash', 900)
  })

  it('clear removes both the token and the user pointer', async () => {
    const redis = makeRedis()
    const store = new PasswordResetStore(asRedis(redis))
    await store.clear(42, 'newhash')
    expect(redis.del).toHaveBeenCalledWith('pwreset:token:newhash')
    expect(redis.del).toHaveBeenCalledWith('pwreset:user:42')
  })
})

describe('EmailChangeStore', () => {
  it('setCode lowercases the new email in the payload', async () => {
    const redis = makeRedis()
    const store = new EmailChangeStore(asRedis(redis))
    await store.setCode(7, 'New@Example.com', '111111', 900)
    expect(redis.set).toHaveBeenCalledWith(
      'emailchange:code:7',
      expect.objectContaining({ newEmail: 'new@example.com', code: '111111' }),
      900
    )
  })
})

describe('StepUpStore', () => {
  it('getUserFailures defaults to 0 when unset', async () => {
    const redis = makeRedis()
    redis.get.mockResolvedValueOnce(null)
    const store = new StepUpStore(asRedis(redis))
    await expect(store.getUserFailures(1)).resolves.toBe(0)
  })

  it('incrementUserFailures expires only on the first failure', async () => {
    const redis = makeRedis()
    const store = new StepUpStore(asRedis(redis))
    redis.incr.mockResolvedValueOnce(1)
    await store.incrementUserFailures(1, 900)
    expect(redis.expire).toHaveBeenCalledWith('stepup:fail:1', 900)
  })

  it('getLockRemaining returns 0 when the lock has no TTL', async () => {
    const redis = makeRedis()
    redis.ttl.mockResolvedValueOnce(-2)
    const store = new StepUpStore(asRedis(redis))
    await expect(store.getLockRemaining(1)).resolves.toBe(0)
  })

  it('getLockRemaining returns the seconds left on the lock', async () => {
    const redis = makeRedis()
    redis.ttl.mockResolvedValueOnce(3600)
    const store = new StepUpStore(asRedis(redis))
    await expect(store.getLockRemaining(1)).resolves.toBe(3600)
  })

  it('incrementLockLevel refreshes the decay window on every lockout', async () => {
    const redis = makeRedis()
    const store = new StepUpStore(asRedis(redis))
    redis.incr.mockResolvedValueOnce(2)
    await store.incrementLockLevel(1, 86400)
    expect(redis.expire).toHaveBeenCalledWith('stepup:locklevel:1', 86400)
  })
})

describe('WebauthnStore', () => {
  it('keys challenges by scope + id', async () => {
    const redis = makeRedis()
    const store = new WebauthnStore(asRedis(redis))
    await store.setChallenge('reg', 5, { challenge: 'x' }, 120)
    expect(redis.set).toHaveBeenCalledWith(
      'webauthn:reg:5',
      { challenge: 'x' },
      120
    )
  })
})

describe('OAuthStateStore', () => {
  it('keys state by provider', async () => {
    const redis = makeRedis()
    const store = new OAuthStateStore(asRedis(redis))
    await store.set('google', 'st', { codeVerifier: 'v' }, 600)
    expect(redis.set).toHaveBeenCalledWith(
      'oauth:state:google:st',
      { codeVerifier: 'v' },
      600
    )
  })
})

describe('TrustedDeviceStore', () => {
  it('cache is a no-op when ttl <= 0', async () => {
    const redis = makeRedis()
    const store = new TrustedDeviceStore(asRedis(redis))
    await store.cache('h', 1, 0)
    expect(redis.set).not.toHaveBeenCalled()
  })

  it('getUser returns null for a non-numeric value', async () => {
    const redis = makeRedis()
    redis.get.mockResolvedValueOnce(null)
    const store = new TrustedDeviceStore(asRedis(redis))
    await expect(store.getUser('h')).resolves.toBeNull()
  })
})

describe('SudoStore', () => {
  it('getTtl returns null when the key has no TTL', async () => {
    const redis = makeRedis()
    redis.ttl.mockResolvedValueOnce(-1)
    const store = new SudoStore(asRedis(redis))
    await expect(store.getTtl('jti')).resolves.toBeNull()
  })

  it('grant sets the flag and clears attempts', async () => {
    const redis = makeRedis()
    const store = new SudoStore(asRedis(redis))
    await store.grant('jti', 300)
    expect(redis.set).toHaveBeenCalledWith('sudo:jti', 1, 300)
    expect(redis.del).toHaveBeenCalledWith('sudo:attempts:jti')
  })
})

describe('SessionStore', () => {
  it('delete also revokes the session-scoped sudo grant', async () => {
    const redis = makeRedis()
    const sudo = { revoke: jest.fn() } as unknown as SudoStore
    const store = new SessionStore(asRedis(redis), sudo)
    await store.delete('jti')
    expect(redis.del).toHaveBeenCalledWith('session:jti')
    expect(sudo.revoke).toHaveBeenCalledWith('jti')
  })
})

describe('MfaEnrolmentStore', () => {
  it('keys the pending TOTP secret by user', async () => {
    const redis = makeRedis()
    const store = new MfaEnrolmentStore(asRedis(redis))
    await store.setPendingTotp(9, 'enc', 900)
    expect(redis.set).toHaveBeenCalledWith('totp:pending:9', 'enc', 900)
  })
})
