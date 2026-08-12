import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from '../auth.service'
import { Sessions } from '@rufieltics/db/domains/auth'

jest.mock('@rufieltics/db/domains/auth', () => ({
  Sessions: {
    findByDeviceKey: jest.fn(),
    findByJti: jest.fn(),
    findActiveByUserId: jest.fn(),
    revokeByJti: jest.fn(),
    revokeAllByUserId: jest.fn(),
  },
  TrustedDevices: { revokeAllByUser: jest.fn().mockResolvedValue([]) },
  PasswordSecurity: {},
}))
jest.mock('@rufieltics/db/domains/identity/user', () => ({
  getSessionUser: jest.fn(),
  updateUser: jest.fn(),
  getUserCredentials: jest.fn(),
  getUserLockState: jest.fn(),
}))

const i18n = { t: (k: string) => k, lang: 'en' } as never

describe('AuthService refresh-token revocation scoping', () => {
  let redisService: {
    get: jest.Mock
    set: jest.Mock
    del: jest.Mock
    setNX: jest.Mock
  }
  let sessionStore: { get: jest.Mock; set: jest.Mock; delete: jest.Mock }
  let jwtService: {
    verifyRefreshToken: jest.Mock
    getAccessExpiresIn: jest.Mock
    getRefreshExpiresIn: jest.Mock
  }
  let tokenDenylist: { deny: jest.Mock; denyMany: jest.Mock }
  let eventEmitter: { emit: jest.Mock }
  let service: AuthService

  const buildRedisGet = (map: Record<string, unknown>) => (key: string) =>
    Promise.resolve(key in map ? map[key] : null)

  beforeEach(() => {
    jest.clearAllMocks()
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
      setNX: jest.fn().mockResolvedValue(true),
    }
    sessionStore = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      delete: jest.fn(),
    }
    jwtService = {
      verifyRefreshToken: jest.fn(),
      getAccessExpiresIn: jest.fn().mockReturnValue(900),
      getRefreshExpiresIn: jest.fn().mockReturnValue(604800),
    }
    tokenDenylist = { deny: jest.fn(), denyMany: jest.fn() }
    eventEmitter = { emit: jest.fn() }

    service = new AuthService(
      redisService as never,
      sessionStore as never,
      {} as never,
      {} as never,
      jwtService as never,
      eventEmitter as never,
      tokenDenylist as never,
      {} as never,
      { get: (_k: string, d: number) => d } as never
    )
  })

  it('reused (rotated) token revokes ONLY the offending device, not all sessions', async () => {
    jwtService.verifyRefreshToken.mockReturnValue({ jti: 'oldJti' })
    redisService.get.mockImplementation(
      buildRedisGet({
        'revoked_jti:oldJti': { userId: 7, deviceKey: 'devKeyA' },
        'refresh:lock:oldJti': 'oldJti',
      })
    )
    ;(Sessions.findByDeviceKey as jest.Mock).mockResolvedValue({
      jti: 'curA',
      isRevoked: false,
    })

    await expect(
      service.refreshToken({ refreshToken: 'rt' }, i18n)
    ).rejects.toThrow(UnauthorizedException)

    expect(Sessions.revokeByJti).toHaveBeenCalledWith('curA')
    expect(tokenDenylist.deny).toHaveBeenCalledWith('curA', 900)
    expect(Sessions.revokeAllByUserId).not.toHaveBeenCalled()
  })

  it('a revoked session (e.g. cookies cleared then token replayed) is rejected without cascading', async () => {
    jwtService.verifyRefreshToken.mockReturnValue({ jti: 'jX' })
    redisService.get.mockImplementation(
      buildRedisGet({ 'refresh:lock:jX': 'jX' })
    )
    ;(Sessions.findByJti as jest.Mock).mockResolvedValue({
      jti: 'jX',
      userId: 7,
      isRevoked: true,
    })

    await expect(
      service.refreshToken({ refreshToken: 'rt' }, i18n)
    ).rejects.toThrow('auth.errors.session_revoked')

    expect(Sessions.revokeAllByUserId).not.toHaveBeenCalled()
    expect(eventEmitter.emit).not.toHaveBeenCalledWith(
      'auth.security.compromise',
      expect.anything()
    )
  })

  it('revokeDeviceSession revokes the matching device and no-ops on a null key', async () => {
    ;(Sessions.findByDeviceKey as jest.Mock).mockResolvedValue({
      jti: 'curB',
      isRevoked: false,
    })
    await service.revokeDeviceSession(7, 'devKeyB')
    expect(Sessions.revokeByJti).toHaveBeenCalledWith('curB')
    expect(sessionStore.delete).toHaveBeenCalledWith('curB')

    jest.clearAllMocks()
    await service.revokeDeviceSession(7, null)
    expect(Sessions.findByDeviceKey).not.toHaveBeenCalled()
    expect(Sessions.revokeByJti).not.toHaveBeenCalled()
  })
})
