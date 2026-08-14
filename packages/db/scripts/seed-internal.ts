import { seedPermissionsAndRoles } from '../src/domains/internal'

async function main() {
  const result = await seedPermissionsAndRoles()
  console.log(
    `Internal RBAC seeded. Permissions: ${result.permissions}, system roles: ${result.roles}`
  )
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
