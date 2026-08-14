import { createHmac } from 'node:crypto'
import { StaffAccounts } from '@rufieltics/db/domains/internal'

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url')
}

function signInvite(sub: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(
    JSON.stringify({
      sub,
      typ: 'staff-invite',
      iat: now,
      exp: now + 7 * 24 * 60 * 60,
    })
  )
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

async function main() {
  const email = process.argv[2]
  const name = process.argv[3] ?? 'Platform Owner'
  const secret = process.env.STAFF_INVITE_SECRET
  const webUrl = process.env.PLATFORM_WEB_URL ?? 'http://localhost:3001'

  if (!email) {
    console.error('Usage: bootstrap-superadmin <email> [name]')
    process.exit(1)
  }
  if (!secret) {
    console.error('STAFF_INVITE_SECRET is not set.')
    process.exit(1)
  }

  const existing = await StaffAccounts.countSuperAdmins()
  if (existing > 0) {
    console.error('A super-admin already exists. Refusing to create another.')
    process.exit(1)
  }

  const staff = await StaffAccounts.create({
    email,
    name,
    isSuperAdmin: true,
    status: 'INVITED',
  })
  const token = signInvite(staff.id, secret)

  console.log('Super-admin invited (status INVITED, no password yet).')
  console.log('Staff id  :', staff.id)
  console.log('Setup URL :', `${webUrl}/staff/setup?token=${token}`)
  console.log('Invite tok:', token)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
