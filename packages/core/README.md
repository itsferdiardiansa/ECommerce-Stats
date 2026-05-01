# @rufieltics/core

Shared configs and utilities for Rufieltics apps. Currently exposes Jest presets for Node/Nest and Next.js targets.

## Jest presets

### Node / Nest

```ts
// apps/<your-nest-app>/jest.config.ts
import type { Config } from 'jest'
import preset from '@rufieltics/core/jest/node'

const config: Config = {
  ...preset,
  rootDir: 'src',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../tsconfig.spec.json' },
    ],
  },
}

export default config
```

### Next.js

```js
// apps/<your-next-app>/jest.config.js
const nextJest = require('next/jest')
const preset = require('@rufieltics/core/jest/next')

const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  ...preset,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
})
```

## Adding new presets

Drop a new file under `jest/` (e.g. `jest/integration.cjs`) and expose it via the `exports` map in `package.json`.
