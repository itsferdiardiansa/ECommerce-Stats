import { BadRequestException } from '@nestjs/common'
import { EmailChangeService } from '../email-change.service'
import * as userDomain from '@rufieltics/db/domains/identity/user'
import { renderEmail } from '@rufieltics/emails'

jest.mock('@rufieltics/db/domains/identity/user', () => ({
  getUserByEmail: jest.fn(),
  getUserCredentials: jest.fn(),
  updateUser: jest.fn(),
}))
jest.mock('@rufieltics/emails', () => ({ renderEmail: jest.fn() }))

const i18n = { t: (k: string) => k, lang: 'en' } as never

describe('EmailChangeService', () => {
  let store: {
    setCode: jest.Mock
    getCode: jest.Mock
    incrementAttempts: jest.Mock
    deleteCode: jest.Mock
  }
  let mailQueue: { enqueue: jest.Mock }
  let service: EmailChangeService

  beforeEach(() => {
    jest.clearAllMocks()
    store = {
      setCode: jest.fn(),
      getCode: jest.fn(),
      incrementAttempts: jest.fn(),
      deleteCode: jest.fn(),
    }
    mailQueue = { enqueue: jest.fn() }
    const config = { get: (_k: string, d: number) => d }
    service = new EmailChangeService(
      store as never,
      mailQueue as never,
      config as never
    )
    ;(renderEmail as jest.Mock).mockResolvedValue({
      subject: 's',
      html: 'h',
      text: 't',
    })
  })

  describe('requestChange', () => {
    it('sends a code to the new address when it is free', async () => {
      ;(userDomain.getUserCredentials as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'old@x.com',
        name: 'Ada',
      })
      ;(userDomain.getUserByEmail as jest.Mock).mockResolvedValue(null)

      await service.requestChange(1, 'New@X.com', i18n)

      expect(store.setCode).toHaveBeenCalledWith(
        1,
        'new@x.com',
        expect.any(String),
        expect.any(Number)
      )
      expect(mailQueue.enqueue).toHaveBeenCalledTimes(1)
    })

    it('rejects an email already in use', async () => {
      ;(userDomain.getUserCredentials as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'old@x.com',
        name: 'Ada',
      })
      ;(userDomain.getUserByEmail as jest.Mock).mockResolvedValue({ id: 2 })

      await expect(
        service.requestChange(1, 'taken@x.com', i18n)
      ).rejects.toThrow(BadRequestException)
      expect(store.setCode).not.toHaveBeenCalled()
    })
  })

  describe('confirmChange', () => {
    it('updates the email on a matching code', async () => {
      store.getCode.mockResolvedValue({ newEmail: 'new@x.com', code: '123456' })
      store.incrementAttempts.mockResolvedValue(1)
      ;(userDomain.getUserByEmail as jest.Mock).mockResolvedValue(null)

      const res = await service.confirmChange(1, '123456', i18n)

      expect(userDomain.updateUser).toHaveBeenCalledWith(1, {
        email: 'new@x.com',
        emailVerifiedAt: expect.any(Date),
      })
      expect(store.deleteCode).toHaveBeenCalled()
      expect(res).toEqual({ email: 'new@x.com' })
    })

    it('rejects a wrong code without updating', async () => {
      store.getCode.mockResolvedValue({ newEmail: 'new@x.com', code: '123456' })
      store.incrementAttempts.mockResolvedValue(1)

      await expect(service.confirmChange(1, '000000', i18n)).rejects.toThrow(
        BadRequestException
      )
      expect(userDomain.updateUser).not.toHaveBeenCalled()
    })
  })
})
