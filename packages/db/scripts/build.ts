import { execSync } from 'node:child_process'
import {
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

const cwd = resolve(process.cwd())

const steps = [
  {
    name: 'Clean dist',
    action: () => {
      const distPath = resolve(cwd, 'dist')
      if (existsSync(distPath)) {
        rmSync(distPath, { recursive: true, force: true })
      }
    },
  },
  {
    name: 'Prisma Generate',
    command: 'pnpm generate',
  },
  {
    name: 'Type Check & Build (TSC)',
    command: 'tsc --project tsconfig.build.json',
  },
  {
    name: 'Copy Prisma Generated Assets',
    command: 'node scripts/copyPrismaGenerated.mjs',
  },
  {
    name: 'Resolve TS Aliases',
    command: 'tsc-alias --project tsconfig.alias.json',
  },
  {
    name: 'Package.json & Readme',
    action: () => {
      // 1. Copy README
      if (existsSync(resolve(cwd, 'README.md'))) {
        copyFileSync(resolve(cwd, 'README.md'), resolve(cwd, 'dist/README.md'))
      }

      // 2. Transform and copy package.json
      const pkgJsonContent = readFileSync(resolve(cwd, 'package.json'), 'utf-8')
      const pkg = JSON.parse(pkgJsonContent)

      // Update exports to remove "dist/" prefix
      if (pkg.exports) {
        for (const key in pkg.exports) {
          const exportEntry = pkg.exports[key]
          if (typeof exportEntry === 'string') {
            pkg.exports[key] = exportEntry.replace('./dist/', './')
          } else if (typeof exportEntry === 'object') {
            for (const subKey in exportEntry) {
              if (typeof exportEntry[subKey] === 'string') {
                exportEntry[subKey] = exportEntry[subKey].replace(
                  './dist/',
                  './'
                )
              }
            }
          }
        }
      }

      // Remove publishConfig since we are now in the publish directory
      delete pkg.publishConfig

      // Remove files array as we are already in the directory
      delete pkg.files

      // Remove scripts that are not needed in the build artifact or might cause issues
      delete pkg.scripts

      // Remove devDependencies
      delete pkg.devDependencies

      writeFileSync(
        resolve(cwd, 'dist/package.json'),
        JSON.stringify(pkg, null, 2)
      )
    },
  },
]

console.log(`\n Building @rufieltics/db...\n`)

for (const step of steps) {
  console.log(`[Step] ${step.name}...`)
  try {
    if (step.action) {
      step.action()
    } else if (step.command) {
      execSync(step.command, { stdio: 'inherit', cwd })
    }
    console.log(`${step.name} complete.\n`)
  } catch (error) {
    console.error(`${step.name} failed!`)
    console.error(error)
    process.exit(1)
  }
}

console.log(`✨ Build successfully completed!`)
