import { db } from '@/libs/prisma'

export interface UserProfileWriteInput {
  bio?: string | null
  birthDate?: Date | null
  gender?: string | null
  languagePref?: string
  currencyPref?: string
  marketingOptIn?: boolean
}

export async function getUserProfile(userId: number) {
  return db.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
}

export async function upsertUserProfile(
  userId: number,
  data: UserProfileWriteInput
) {
  return db.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}
