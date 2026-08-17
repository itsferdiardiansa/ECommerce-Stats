import { db } from '@/libs/prisma'

export const PERMISSION_KEYS = [
  'users.view',
  'users.manage',
  'users.ban',
  'lockouts.manage',
  'organizations.view',
  'analytics.view',
  'integrations.view',
  'integrations.manage',
  'plans.view',
  'plans.manage',
  'billing.view',
  'payments.manage',
  'revenue.view',
  'staff.view',
  'staff.manage',
  'roles.manage',
  'audit.view',
  'settings.manage',
  'support.view',
  'notifications.manage',
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
    description: 'Handle user issues: view users, manage lockouts, tickets.',
    permissions: [
      'users.view',
      'lockouts.manage',
      'organizations.view',
      'support.view',
    ],
  },
  {
    key: 'billing',
    name: 'Billing',
    description: 'Manage plans, subscriptions and payment providers.',
    permissions: [
      'plans.view',
      'plans.manage',
      'billing.view',
      'payments.manage',
      'users.view',
    ],
  },
  {
    key: 'read_only',
    name: 'Read only',
    description: 'View-only access across the admin console.',
    permissions: [
      'users.view',
      'organizations.view',
      'analytics.view',
      'integrations.view',
      'plans.view',
      'billing.view',
      'revenue.view',
      'audit.view',
    ],
  },
  {
    key: 'user_admin',
    name: 'User admin',
    description: 'Full user lifecycle: view, edit and ban accounts.',
    permissions: ['users.view', 'users.manage', 'users.ban'],
  },
  {
    key: 'security',
    name: 'Security',
    description: 'Investigate and lock down accounts, review the audit trail.',
    permissions: ['users.view', 'users.ban', 'lockouts.manage', 'audit.view'],
  },
  {
    key: 'finance',
    name: 'Finance',
    description: 'Manage plans, payments and read revenue reporting.',
    permissions: [
      'plans.view',
      'plans.manage',
      'billing.view',
      'payments.manage',
      'revenue.view',
    ],
  },
  {
    key: 'analyst',
    name: 'Analyst',
    description: 'Read revenue, analytics, integrations and the audit trail.',
    permissions: [
      'revenue.view',
      'analytics.view',
      'integrations.view',
      'plans.view',
      'organizations.view',
      'audit.view',
    ],
  },
  {
    key: 'org_manager',
    name: 'Organization manager',
    description: 'Review organizations and their users.',
    permissions: ['organizations.view', 'users.view'],
  },
  {
    key: 'compliance',
    name: 'Compliance',
    description: 'Read-only oversight for audit and account data.',
    permissions: ['audit.view', 'users.view', 'organizations.view'],
  },
  {
    key: 'staff_admin',
    name: 'Staff admin',
    description: 'Manage staff accounts, roles and announcements.',
    permissions: [
      'staff.view',
      'staff.manage',
      'roles.manage',
      'notifications.manage',
    ],
  },
  {
    key: 'integrations_manager',
    name: 'Integrations manager',
    description: 'Connect and manage store, ad and analytics integrations.',
    permissions: ['integrations.view', 'integrations.manage'],
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

export const Permissions = {
  async list() {
    return db.permission.findMany({ orderBy: { key: 'asc' } })
  },
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
