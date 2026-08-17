import { buildOtpauthUri, hashPassword } from '@rufieltics/auth-core'
import { db } from '@/libs/prisma'
import { seedPermissionsAndRoles, SYSTEM_ROLES } from '../src/domains/internal'

const DOMAIN = 'roles.rufieltics.local'
const PASSWORD = 'Passw0rd!Roles'
const TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
const ISSUER = 'Rufieltics Admin'

async function upsertUser(params: {
  email: string
  name: string
  passwordHash: string
  isSuperAdmin?: boolean
  roleKey?: string
}) {
  const staff = await db.staffAccount.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      passwordHash: params.passwordHash,
      status: 'ACTIVE',
      mfaEnabled: true,
      isSuperAdmin: params.isSuperAdmin ?? false,
    },
    create: {
      email: params.email,
      name: params.name,
      passwordHash: params.passwordHash,
      status: 'ACTIVE',
      mfaEnabled: true,
      isSuperAdmin: params.isSuperAdmin ?? false,
    },
  })

  await db.staffAccountRole.deleteMany({
    where: { staffAccountId: staff.id },
  })
  if (params.roleKey) {
    const role = await db.staffRole.findUnique({
      where: { key: params.roleKey },
      select: { id: true },
    })
    if (role) {
      await db.staffAccountRole.create({
        data: { staffAccountId: staff.id, roleId: role.id },
      })
    }
  }

  await db.staffTotp.upsert({
    where: { staffAccountId: staff.id },
    update: { secret: TOTP_SECRET, confirmedAt: new Date() },
    create: {
      staffAccountId: staff.id,
      secret: TOTP_SECRET,
      confirmedAt: new Date(),
    },
  })

  return staff
}

async function main() {
  await seedPermissionsAndRoles()
  const passwordHash = await hashPassword(PASSWORD)

  const rows: { access: string; email: string }[] = []

  await upsertUser({
    email: `superadmin@${DOMAIN}`,
    name: 'Super Admin',
    passwordHash,
    isSuperAdmin: true,
  })
  rows.push({
    access: 'Super admin (all permissions)',
    email: `superadmin@${DOMAIN}`,
  })

  for (const role of SYSTEM_ROLES) {
    const email = `${role.key}@${DOMAIN}`
    await upsertUser({
      email,
      name: `${role.name} (role demo)`,
      passwordHash,
      roleKey: role.key,
    })
    rows.push({
      access: `${role.name} · ${role.permissions.join(', ')}`,
      email,
    })
  }

  const otpauth = buildOtpauthUri(TOTP_SECRET, `roles@${DOMAIN}`, ISSUER)

  console.log('\nRole demo staff seeded (all ACTIVE, MFA on).\n')
  console.table(rows)
  console.log(`\nShared password : ${PASSWORD}`)
  console.log(`Shared TOTP key : ${TOTP_SECRET}`)
  console.log(`otpauth URI     : ${otpauth}`)
  console.log(
    '\nAdd the TOTP key once to any authenticator app - the same 6-digit code works for every account above.\n'
  )
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
