import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/analytics.prisma',
  migrations: {
    path: 'prisma/migrations_analytics',
  },
  datasource: {
    url: env('ANALYTICS_DATABASE_URL'),
  },
})
