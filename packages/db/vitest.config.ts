import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.ts'],
    exclude: [
      '**/prisma/**',
      'prisma/**',
      'prisma/generated/**',
      '**/node_modules/**',
      '**/.git/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'prisma/**',
        'prisma/generated/**',
        'dist/**',
        'node_modules/**',
        '**/types.ts',
        '**/*.types.ts',
      ],
    },
  },
})
