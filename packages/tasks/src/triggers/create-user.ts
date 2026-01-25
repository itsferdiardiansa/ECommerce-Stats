import { schedules, task } from '@trigger.dev/sdk'
import { getDb } from '@rufieltics/db'

export async function createUser(payload: { email?: string }) {
  const db = getDb()
  const email = payload.email || `trigger+${Date.now()}@local`
  const user = await db.user.create({ data: { email } })
  return user
}

export const createUserTask = task({
  id: 'create-user-task',
  run: async (payload: { email?: string }) => {
    const user = await createUser(payload)

    console.log(`Created user ${user.email} (id=${user.id})`)

    return {
      message: `Created user ${user.email}`,
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
    }
  },
})

export const scheduledCreateUser = schedules.task({
  id: 'scheduled-create-user',
  cron: {
    pattern: '*/2 * * * *',
    timezone: 'Asia/Jakarta',
    environments: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
  },
  run: async _payload => {
    const user = await createUser({})
    console.log(`Scheduled created user ${user.email} (id=${user.id})`)
    return {
      message: `created user ${user.email}`,
      userId: user.id,
      email: user.email,
    }
  },
})
