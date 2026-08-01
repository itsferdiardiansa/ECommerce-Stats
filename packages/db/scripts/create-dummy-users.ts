import { faker } from '@faker-js/faker'
import { db } from '@/libs/prisma'
import { fileURLToPath } from 'url'

async function createUsers(count = 10) {
  const created = []
  for (let i = 0; i < count; i++) {
    const username =
      Math.random() < 0.2
        ? undefined
        : `${faker.person.firstName().toLowerCase()}${faker.person.lastName().slice(0, 4).toLowerCase()}${Math.floor(Math.random() * 10000)}`
    const email = faker.internet.email().toLowerCase()
    try {
      const user = await db.user.create({
        data: {
          email,
          name: faker.person.fullName(),
          username,
          avatar: `https://i.pravatar.cc/150?u=${email}`,
          phone: faker.phone.number(),
          isActive: Math.random() < 0.95,
        },
      })
      created.push(user as (typeof created)[number])
    } catch (err: unknown) {
      console.error(
        'create user failed:',
        err instanceof Error ? err.message : String(err)
      )
    }
  }
  return created
}

async function main() {
  const count = parseInt(process.argv[2] ?? '10', 10)
  console.log(`Creating ${count} dummy users...`)
  const users = await createUsers(count)
  console.log(`Created ${users.length} users.`)
  users
    .slice(0, 5)
    .forEach((u: { id: string; email: string; username?: string }, i) =>
      console.log(`#${i + 1}`, {
        id: u.id,
        email: u.email,
        username: u.username,
      })
    )
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
    .then(() => process.exit(0))
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}

export { createUsers }
