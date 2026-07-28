import { BadRequestException } from '@nestjs/common'
import { PasswordResetService } from './password-reset.service'
import * as userDomain from '@rufieltics/db/domains/identity/user'
import { PasswordSecurity } from '@rufieltics/db/domains/auth'
import { renderEmail } from '@rufieltics/emails'

jest.mock('@rufieltics/db/domains/identity/user', () => ({
  getUserByEmail: jest.fn(),
  getUserCredentials: jest.fn(),
  updateUser: jest.fn(),
}))
jest.mock('@rufieltics/db/domains/auth', () => ({
  PasswordSecurity: {
    getRecentPasswords: jest.fn(),
    archivePassword: jest.fn(),
  },
}))
jest.mock('@rufieltics/emails', () => ({ renderEmail: jest.fn() }))

const i18n = { t: (k: string) => k, lang: 'en' } as never

describe('PasswordResetService', () => {
  let resetStore: {
    set: jest.Mock
    get: jest.Mock
    delete: jest.Mock
  }
  let mailQueue: { enqueue: jest.Mock }
  let authService: { revokeAllSessions: jest.Mock }
  let eventEmitter: { emit: jest.Mock }
  let service: PasswordResetService

  beforeEach(() => {
    jest.clearAllMocks()
    resetStore = { set: jest.fn(), get: jest.fn(), delete: jest.fn() }
    mailQueue = { enqueue: jest.fn() }
    authService = { revokeAllSessions: jest.fn() }
    eventEmitter = { emit: jest.fn() }
    const config = { get: (_k: string, d: number) => d }
    service = new PasswordResetService(
      resetStore as never,
      mailQueue as never,
      authService as never,
      eventEmitter as never,
      config as never
    )
    ;(renderEmail as jest.Mock).mockResolvedValue({
      subject: 's',
      html: 'h',
      text: 't',
    })
  })

  describe('forgotPassword', () => {
    it('emails a token when the user exists', async () => {
      ;(userDomain.getUserByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Ada',
      })
      await service.forgotPassword('ada@x.com', i18n)
      expect(resetStore.set).toHaveBeenCalledTimes(1)
      expect(mailQueue.enqueue).toHaveBeenCalledTimes(1)
    })

    it('is a silent no-op when the user does not exist (enumeration-safe)', async () => {
      ;(userDomain.getUserByEmail as jest.Mock).mockResolvedValue(null)
      await service.forgotPassword('nobody@x.com', i18n)
      expect(resetStore.set).not.toHaveBeenCalled()
      expect(mailQueue.enqueue).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('rejects an unknown/expired token', async () => {
      resetStore.get.mockResolvedValue(null)
      await expect(
        service.resetPassword('tok', 'NewPass123!', i18n)
      ).rejects.toThrow(BadRequestException)
    })

    it('sets the password, deletes the token, and revokes all sessions', async () => {
      resetStore.get.mockResolvedValue({ userId: 1 })
      ;(userDomain.getUserCredentials as jest.Mock).mockResolvedValue({
        id: 1,
        passwordHash: null,
      })
      ;(PasswordSecurity.getRecentPasswords as jest.Mock).mockResolvedValue([])

      await service.resetPassword('tok', 'NewPass123!', i18n)

      const updateArg = (userDomain.updateUser as jest.Mock).mock.calls[0]
      expect(updateArg[0]).toBe(1)
      expect(updateArg[1].passwordHash).toEqual(expect.any(String))
      expect(updateArg[1].passwordChangedAt).toBeInstanceOf(Date)
      expect(resetStore.delete).toHaveBeenCalledTimes(1)
      expect(authService.revokeAllSessions).toHaveBeenCalledWith(1)
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1)
    })
  })
})
