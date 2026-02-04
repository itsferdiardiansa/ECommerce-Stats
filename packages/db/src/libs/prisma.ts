import 'dotenv/config'
import { PrismaClient } from '../../prisma/generated/index.js'
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as PrismaAnalyticsClient } from '../../prisma/generated-analytics/index.js'
import { PrismaPg } from '@prisma/adapter-pg'

let _db: PrismaClient | null = null
let _analyticsDb: PrismaAnalyticsClient | null = null

export function getDb(): PrismaClient {
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

export function getAnalyticsDb(): PrismaAnalyticsClient {
  const dbUrl = process.env.ANALYTICS_DATABASE_URL

  if (!dbUrl) {
    throw new Error(
      'ANALYTICS_DATABASE_URL is not defined in environment variables'
    )
  }

  if (!_analyticsDb) {
    const adapter = new PrismaPg({
      connectionString: dbUrl,
      waitingCount: 10,
      idleTimeoutMillis: 5000,
      expiredCount: 10,
      query_timeout: 60000,
    })
    _analyticsDb = new PrismaAnalyticsClient({ adapter })
  }
  return _analyticsDb
}

export const db = getDb()
export const analyticsDb = getAnalyticsDb()
