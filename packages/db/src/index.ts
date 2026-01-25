import 'dotenv/config'
import { PrismaClient as PrismaClientConstructor } from '../prisma/generated/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from '../prisma/generated/index.js'

const { PrismaClient } = pkg

let _db: PrismaClientConstructor | null = null

export function getDb(): PrismaClientConstructor {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables')
  }

  if (!_db) {
    const adapter = new PrismaPg({
      connectionString: dbUrl,
      waitingCount: 10,
      idleTimeoutMillis: 5000,
      expiredCount: 10,
      query_timeout: 60000,
    })
    _db = new PrismaClient({ adapter })
  }
  return _db
}

export default getDb
