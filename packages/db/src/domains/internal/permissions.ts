import { db } from '@/libs/prisma'

export const PERMISSION_KEYS = [
  'users.view',
  'users.manage',
  'users.ban',
  'lockouts.manage',
  'organizations.view',
  'plans.view',
  'plans.manage',
  'revenue.view',
  'staff.view',
  'staff.manage',
  'audit.view',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export interface SystemRoleSeed {
  key: string
  name: string
  description: string
  permissions: PermissionKey[]
}

export const SYSTEM_ROLES: SystemRoleSeed[] = [
  {
    key: 'support',
    name: 'Support',
    description: 'Handle user issues: view users, manage lockouts.',
    permissions: ['users.view', 'lockouts.manage', 'organizations.view'],
  },
  {
    key: 'billing',
    name: 'Billing',
    description: 'Manage plans and view billing-related user data.',
    permissions: ['plans.view', 'plans.manage', 'users.view'],
  },
  {
    key: 'read_only',
    name: 'Read only',
    description: 'View-only access across the admin console.',
    permissions: [
      'users.view',
      'plans.view',
      'organizations.view',
      'audit.view',
    ],
  },
]

export async function seedPermissionsAndRoles() {
  for (const key of PERMISSION_KEYS) {
    await db.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    })
  }

  for (const role of SYSTEM_ROLES) {
    const record = await db.staffRole.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    })

    const perms = await db.permission.findMany({
      where: { key: { in: role.permissions } },
      select: { id: true },
    })

    await db.staffRolePermission.deleteMany({ where: { roleId: record.id } })
    await db.staffRolePermission.createMany({
      data: perms.map(p => ({ roleId: record.id, permissionId: p.id })),
      skipDuplicates: true,
    })
  }

  return {
    permissions: PERMISSION_KEYS.length,
    roles: SYSTEM_ROLES.length,
  }
}

export async function getStaffPermissions(
  staffAccountId: string
): Promise<string[]> {
  const staff = await db.staffAccount.findUnique({
    where: { id: staffAccountId },
    select: {
      isSuperAdmin: true,
      roles: {
        select: {
          role: {
            select: { permissions: { select: { permission: true } } },
          },
        },
      },
    },
  })

  if (!staff) return []
  if (staff.isSuperAdmin) return [...PERMISSION_KEYS]

  const keys = new Set<string>()
  for (const r of staff.roles) {
    for (const rp of r.role.permissions) keys.add(rp.permission.key)
  }
  return [...keys]
}
