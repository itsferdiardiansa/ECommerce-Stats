import {
  Organizations,
  OrganizationMembers,
} from '@rufieltics/db/domains/identity/organization'
import { generateOrgSlug } from './auth'

export async function provisionPersonalWorkspace(
  userId: number,
  name: string,
  username: string
): Promise<void> {
  const existing = await OrganizationMembers.listByUser(userId)
  if (existing.length > 0) return

  const org = await Organizations.create({
    name: `${name}'s Workspace`,
    slug: generateOrgSlug(username),
  })

  await OrganizationMembers.addMember({
    organizationId: org.id,
    userId,
    role: 'OWNER',
  })
}
