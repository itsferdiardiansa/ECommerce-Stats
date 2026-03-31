import { db } from '../src/libs/prisma'
import { randomUUID } from 'crypto'

function generateOrgSlug(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const suffix = randomUUID().slice(0, 8)
  return `${base}-${suffix}`
}

async function main() {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      memberships: true,
    },
  })

  let created = 0
  let skipped = 0

  for (const user of users) {
    if (user.memberships.length > 0) {
      console.log(`⏭  Skipping ${user.email} — already has ${user.memberships.length} org(s)`)
      skipped++
      continue
    }

    const org = await db.organization.create({
      data: {
        name: `${user.name}'s Workspace`,
        slug: generateOrgSlug(user.username),
      },
    })

    await db.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    })

    console.log(`✅ Created workspace "${org.name}" (${org.slug}) for ${user.email}`)
    created++
  }

  console.log(`\nDone — ${created} workspace(s) created, ${skipped} user(s) skipped.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
