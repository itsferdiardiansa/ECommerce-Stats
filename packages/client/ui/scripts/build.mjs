import { execSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'

rmSync('dist', { recursive: true, force: true })
execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' })
execSync('tsc-alias -p tsconfig.build.json', { stdio: 'inherit' })

// Ship static assets (tsc only emits .js/.d.ts).
mkdirSync('dist/assets', { recursive: true })
cpSync('src/assets', 'dist/assets', { recursive: true })

// tsc-alias rewrites `@/` for code modules but skips non-code targets (e.g. .svg).
// Resolve any remaining `@/assets/*` imports to the correct relative path per file.
function rewriteAssets(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      rewriteAssets(path)
    } else if (path.endsWith('.js') || path.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8')
      if (!source.includes('@/assets/')) continue
      const rel = relative(dirname(path), 'dist/assets').split('\\').join('/')
      writeFileSync(path, source.replaceAll('@/assets/', `${rel}/`))
    }
  }
}
rewriteAssets('dist')
