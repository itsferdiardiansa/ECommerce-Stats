import { randomUUID } from 'crypto'
import { db } from '@/libs/prisma'

function generateOrgSlug(username: string): string {
  const base = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const suffix = randomUUID().slice(0, 8)
  return `${base}-${suffix}`
}

async function main() {
  console.log('Starting backfill of user workspaces...')

  // Find users who do not have any memberships
  const usersWithoutWorkspace = await db.user.findMany({
    where: {
      memberships: {
        none: {},
      },
    },
  })

  console.log(`Found ${usersWithoutWorkspace.length} users without workspaces.`)

  for (const user of usersWithoutWorkspace) {
    console.log(`Creating workspace for user: ${user.email} (ID: ${user.id})`)
    
    // We use a transaction to ensure both organization and membership are created together
    await db.$transaction(async (tx: any) => {
      // Create Organization
      const org = await tx.organization.create({
        data: {
          name: `${user.name}'s Workspace`,
          slug: generateOrgSlug(user.username),
        },
      })
      
      // Create Organization Member (OWNER role)
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: 'OWNER',
        },
      })
    })
  }

  console.log('Backfill complete.')
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Failed to backfill workspaces:', e)
    process.exit(1)
  })
