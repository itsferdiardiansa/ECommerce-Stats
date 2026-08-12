import { db } from '@/libs/prisma'

export interface UserSettingsWriteInput {
  defaultTimezone?: string
  weekStartsOn?: string
  dateFormat?: string
  alertsEmail?: boolean
  weeklyReport?: boolean
}

export async function getUserSettings(userId: number) {
  return db.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
}

export async function upsertUserSettings(
  userId: number,
  data: UserSettingsWriteInput
) {
  return db.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}
