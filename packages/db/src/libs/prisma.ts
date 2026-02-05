import 'dotenv/config'
import { PrismaClient } from '@prisma/generated'
import { PrismaPg } from '@prisma/adapter-pg'

let _db: PrismaClient | null = null

export function getDb(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables')
  }

  if (!_db) {
    const adapter = new PrismaPg({
      connectionString: dbUrl,
    })
    _db = new PrismaClient({ adapter })
  }
  return _db
}

export const db = getDb()
