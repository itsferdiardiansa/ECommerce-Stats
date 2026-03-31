import { db } from '../src/libs/prisma'

async function main() {
  await db.session.deleteMany({})
  console.log('Cleared all sessions.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
