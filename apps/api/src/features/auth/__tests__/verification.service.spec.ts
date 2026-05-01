import { Test } from '@nestjs/testing'
import { VerificationService } from '../verification.service'
import { RedisService } from '@/modules/redis/redis.service'
import { PhoneVerification } from '@rufieltics/db/domains/auth'
import { InMemoryRedisStub } from '@/__tests__/helpers/in-memory-redis'

jest.mock('@rufieltics/db/domains/auth', () => ({
  Verification: {
    findActiveVerificationLockout: jest.fn(),
    clearVerificationLockout: jest.fn(),
    createVerificationLockout: jest.fn(),
  },
  LoginLockouts: {
    findActive: jest.fn(),
    countAllForEmail: jest.fn(),
    clear: jest.fn(),
    create: jest.fn(),
    clearAllForEmail: jest.fn(),
  },
  PhoneVerification: {
    findActiveLockout: jest.fn(),
    createLockout: jest.fn(),
    clearActiveLockout: jest.fn(),
  },
}))

const mockedPhoneVerification = PhoneVerification as jest.Mocked<
  typeof PhoneVerification
>

describe('VerificationService — phone lockout scoping (DoS fix)', () => {
  const PHONE = '+15551234567'
  const ATTACKER = 1001
  const VICTIM = 2002

  let service: VerificationService
  let redis: InMemoryRedisStub

  beforeEach(async () => {
    jest.clearAllMocks()
    redis = new InMemoryRedisStub()

    const moduleRef = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: RedisService, useValue: redis },
      ],
    }).compile()

    service = moduleRef.get(VerificationService)
  })

  describe('setPhoneLockout / getPhoneLockout', () => {
    it('locks out the attacker without locking out the victim on the same phone', async () => {
      await service.setPhoneLockout(PHONE, ATTACKER, 'TOO_MANY_ATTEMPTS')

      const attackerView = await service.getPhoneLockout(PHONE, ATTACKER)
      expect(attackerView).not.toBeNull()
      expect(attackerView?.reason).toBe('TOO_MANY_ATTEMPTS')

      mockedPhoneVerification.findActiveLockout.mockResolvedValueOnce(null)
      const victimView = await service.getPhoneLockout(PHONE, VICTIM)
      expect(victimView).toBeNull()
    })

    it('persists the userId on the DB lockout record', async () => {
      await service.setPhoneLockout(PHONE, ATTACKER, 'TOO_MANY_ATTEMPTS')

      expect(mockedPhoneVerification.createLockout).toHaveBeenCalledWith(
        expect.objectContaining({ phone: PHONE, userId: ATTACKER })
      )
    })

    it('uses Redis keys scoped by (phone, userId)', async () => {
      await service.setPhoneLockout(PHONE, ATTACKER)

      const keys = redis.keys()
      expect(keys).toContain(`phone:lockout:${PHONE}:${ATTACKER}`)
      expect(keys).not.toContain(`phone:lockout:${PHONE}`)
    })

    it('allows independent lockouts for different users on the same phone', async () => {
      await service.setPhoneLockout(PHONE, ATTACKER, 'TOO_MANY_ATTEMPTS')
      await service.setPhoneLockout(PHONE, VICTIM, 'SUSPICIOUS_ACTIVITY')

      const attackerView = await service.getPhoneLockout(PHONE, ATTACKER)
      const victimView = await service.getPhoneLockout(PHONE, VICTIM)

      expect(attackerView?.reason).toBe('TOO_MANY_ATTEMPTS')
      expect(victimView?.reason).toBe('SUSPICIOUS_ACTIVITY')
    })

    it('falls back to DB lookup scoped by userId when Redis cache is cold', async () => {
      mockedPhoneVerification.findActiveLockout.mockResolvedValueOnce({
        id: 1,
        phone: PHONE,
        userId: ATTACKER,
        reason: 'TOO_MANY_ATTEMPTS',
        ipAddress: null,
        userAgent: null,
        lockedAt: new Date(),
        expires: new Date(Date.now() + 86400 * 1000),
        clearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await service.getPhoneLockout(PHONE, ATTACKER)
      expect(result).not.toBeNull()
      expect(mockedPhoneVerification.findActiveLockout).toHaveBeenCalledWith(
        PHONE,
        ATTACKER
      )
    })
  })

  describe('clearPhoneLockout', () => {
    it('only clears the targeted user, not other users on the same phone', async () => {
      await service.setPhoneLockout(PHONE, ATTACKER, 'TOO_MANY_ATTEMPTS')
      await service.setPhoneLockout(PHONE, VICTIM, 'SUSPICIOUS_ACTIVITY')

      await service.clearPhoneLockout(PHONE, ATTACKER)

      expect(redis.has(`phone:lockout:${PHONE}:${ATTACKER}`)).toBe(false)
      expect(redis.has(`phone:lockout:${PHONE}:${VICTIM}`)).toBe(true)

      expect(mockedPhoneVerification.clearActiveLockout).toHaveBeenCalledWith(
        PHONE,
        ATTACKER
      )
    })
  })

  describe('incrementPhoneOtpAttempts', () => {
    it('tracks attempts independently per user on the same phone', async () => {
      const attackerCount1 = await service.incrementPhoneOtpAttempts(
        PHONE,
        ATTACKER
      )
      const attackerCount2 = await service.incrementPhoneOtpAttempts(
        PHONE,
        ATTACKER
      )
      const victimCount1 = await service.incrementPhoneOtpAttempts(
        PHONE,
        VICTIM
      )

      expect(attackerCount1).toBe(1)
      expect(attackerCount2).toBe(2)
      expect(victimCount1).toBe(1)
    })

    it('uses Redis attempt keys scoped by (phone, userId)', async () => {
      await service.incrementPhoneOtpAttempts(PHONE, ATTACKER)

      const keys = redis.keys()
      expect(keys).toContain(`phone:otp:${PHONE}:${ATTACKER}:attempts`)
      expect(keys).not.toContain(`phone:otp:${PHONE}:attempts`)
    })
  })

  describe('getPhoneOtp', () => {
    it('returns the attempts counter scoped to the OTP owner', async () => {
      await service.setPhoneOtp(PHONE, '123456', ATTACKER)
      await service.incrementPhoneOtpAttempts(PHONE, ATTACKER)
      await service.incrementPhoneOtpAttempts(PHONE, ATTACKER)

      const stored = await service.getPhoneOtp(PHONE)
      expect(stored).not.toBeNull()
      expect(stored?.userId).toBe(ATTACKER)
      expect(stored?.attempts).toBe(2)
    })

    it("does not see the victim's separate attempts when the OTP belongs to the attacker", async () => {
      await service.setPhoneOtp(PHONE, '123456', ATTACKER)
      await service.incrementPhoneOtpAttempts(PHONE, VICTIM)

      const stored = await service.getPhoneOtp(PHONE)
      expect(stored?.userId).toBe(ATTACKER)
      expect(stored?.attempts).toBe(0)
    })
  })

  describe('DoS regression scenario', () => {
    it('attacker exhausting attempts does not lock the victim out of their own phone', async () => {
      await service.setPhoneOtp(PHONE, '999999', ATTACKER)

      const max = service.PHONE_OTP_MAX_ATTEMPTS
      for (let i = 0; i < max; i++) {
        await service.incrementPhoneOtpAttempts(PHONE, ATTACKER)
      }

      await service.setPhoneLockout(PHONE, ATTACKER, 'TOO_MANY_ATTEMPTS')

      mockedPhoneVerification.findActiveLockout.mockResolvedValueOnce(null)
      const victimLockout = await service.getPhoneLockout(PHONE, VICTIM)
      expect(victimLockout).toBeNull()

      const victimFirstAttempt = await service.incrementPhoneOtpAttempts(
        PHONE,
        VICTIM
      )
      expect(victimFirstAttempt).toBe(1)
    })
  })
})
