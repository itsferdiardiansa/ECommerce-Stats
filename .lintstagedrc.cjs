const path = require('path')

const relative = filenames =>
  filenames.map(f => path.relative(process.cwd(), f))

module.exports = {
  '{apps,packages}/**/*.{ts,tsx}': filenames =>
    `pnpm lint ${relative(filenames).join(' ')}`,

  '**/*.{ts,tsx,json,md}': filenames =>
    `pnpm format:write ${relative(filenames).join(' ')}`,

  '**/*.{ts,tsx}': filenames =>
    `pnpm type-check --files=${relative(filenames).join(',')}`
}