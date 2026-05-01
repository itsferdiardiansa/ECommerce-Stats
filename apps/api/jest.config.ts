import type { Config } from 'jest'
import preset from '@rufieltics/core/jest/node'

const config: Config = {
  ...preset,
  rootDir: 'src',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@features/(.*)$': '<rootDir>/features/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../tsconfig.spec.json' },
    ],
  },
}

export default config
