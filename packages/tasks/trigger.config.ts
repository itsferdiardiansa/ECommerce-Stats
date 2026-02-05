import { defineConfig } from '@trigger.dev/sdk'
import { prismaExtension } from '@trigger.dev/build/extensions/prisma'

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? '',
  dirs: ['./src'],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      prismaExtension({
        mode: 'modern',
      }),
    ],
  },
  maxDuration: 3600,
})
