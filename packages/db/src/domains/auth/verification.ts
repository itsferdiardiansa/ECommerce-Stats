import { Prisma } from '@prisma/generated'
import { getDb } from '@/libs/prisma'

export const Verification = {
  async createToken(data: Prisma.VerificationTokenUncheckedCreateInput) {
    const db = getDb()
    return db.verificationToken.create({ data })
  },

  async findToken(identifier: string, token: string) {
    const db = getDb()
    return db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    })
  },

  async deleteToken(identifier: string, token: string) {
    const db = getDb()
    return db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    })
  },

  async createTwoFactorToken(data: Prisma.TwoFactorTokenUncheckedCreateInput) {
    const db = getDb()
    return db.twoFactorToken.create({ data })
  },

  async findTwoFactorToken(email: string, token: string) {
    const db = getDb()
    return db.twoFactorToken.findUnique({
      where: {
        email_token: {
          email,
          token,
        },
      },
    })
  },

  async deleteTwoFactorToken(id: string) {
    const db = getDb()
    return db.twoFactorToken.delete({
      where: { id },
    })
  },

  async deleteTwoFactorTokenByEmail(email: string) {
    const db = getDb()
    return db.twoFactorToken.deleteMany({
      where: { email },
    })
  },

  async createTwoFactorConfirmation(userId: number) {
    const db = getDb()
    return db.twoFactorConfirmation.create({
      data: { userId },
    })
  },

  async findTwoFactorConfirmation(userId: number) {
    const db = getDb()
    return db.twoFactorConfirmation.findUnique({
      where: { userId },
    })
  },

  async deleteTwoFactorConfirmation(userId: number) {
    const db = getDb()
    return db.twoFactorConfirmation.delete({
      where: { userId },
    })
  },
}
