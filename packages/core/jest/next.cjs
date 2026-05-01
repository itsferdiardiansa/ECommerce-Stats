/** @type {import('jest').Config} */
const preset = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.(spec|test)\\.(ts|tsx)$',
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '**/*.(t|j)sx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageDirectory: '../coverage',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/__tests__/helpers/',
  ],
}

module.exports = preset
