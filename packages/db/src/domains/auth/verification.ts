import { Prisma } from '@prisma/generated'
import { db } from '@/libs/prisma'

export const Verification = {
  async createToken(data: Prisma.VerificationTokenUncheckedCreateInput) {
    return db.verificationToken.create({ data })
  },

  async findToken(identifier: string, token: string) {
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
    return db.twoFactorToken.create({ data })
  },

  async findTwoFactorToken(email: string, token: string) {
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
    return db.twoFactorToken.delete({
      where: { id },
    })
  },

  async deleteTwoFactorTokenByEmail(email: string) {
    return db.twoFactorToken.deleteMany({
      where: { email },
    })
  },

  async createTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.create({
      data: { userId },
    })
  },

  async findTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.findUnique({
      where: { userId },
    })
  },

  async deleteTwoFactorConfirmation(userId: number) {
    return db.twoFactorConfirmation.delete({
      where: { userId },
    })
  },
}
