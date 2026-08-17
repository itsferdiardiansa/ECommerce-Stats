import { faker } from '@faker-js/faker'
import { db } from '@/libs/prisma'
import { seedPermissionsAndRoles } from '../src/domains/internal'

const DEMO_DOMAIN = 'demo.rufieltics.local'
const STATUSES = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INVITED', 'SUSPENDED'] as const

function sampleRoles(roleIds: string[], max = 3): string[] {
  const count = faker.number.int({ min: 0, max })
  return faker.helpers.arrayElements(roleIds, count)
}

async function main() {
  const count = Number(process.argv[2] ?? 120)

  await seedPermissionsAndRoles()
  const roles = await db.staffRole.findMany({ select: { id: true } })
  const roleIds = roles.map(r => r.id)

  const removed = await db.staffAccount.deleteMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
  })

  let created = 0
  for (let i = 0; i < count; i++) {
    const first = faker.person.firstName()
    const last = faker.person.lastName()
    const name = `${first} ${last}`
    const email = `${first}.${last}.${i}`
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .concat(`@${DEMO_DOMAIN}`)
    const status = faker.helpers.arrayElement(STATUSES)

    const staff = await db.staffAccount.create({
      data: {
        email,
        name,
        status,
        mfaEnabled: status === 'ACTIVE' && faker.datatype.boolean(),
        lastLoginAt:
          status === 'ACTIVE' ? faker.date.recent({ days: 30 }) : null,
        createdAt: faker.date.past({ years: 1 }),
      },
    })

    const assigned = status === 'INVITED' ? [] : sampleRoles(roleIds)
    if (assigned.length) {
      await db.staffAccountRole.createMany({
        data: assigned.map(roleId => ({ staffAccountId: staff.id, roleId })),
        skipDuplicates: true,
      })
    }
    created++
  }

  console.log(
    `Demo staff seeded. Removed ${removed.count} prior demo rows, created ${created} across ${roleIds.length} roles.`
  )
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
