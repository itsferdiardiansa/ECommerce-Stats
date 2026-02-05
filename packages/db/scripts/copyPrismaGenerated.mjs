import { copyFile, mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(projectRoot, 'prisma', 'generated')
const destDir = resolve(projectRoot, 'dist', 'prisma', 'generated')
const sourceDirAnalytics = resolve(projectRoot, 'prisma', 'generated-analytics')
const destDirAnalytics = resolve(projectRoot, 'dist', 'prisma', 'generated-analytics')

async function copyDir(src, dest) {
	await mkdir(dest, { recursive: true })
	const entries = await readdir(src, { withFileTypes: true })
	for (const entry of entries) {
		if (entry.name === 'node_modules') continue
		const srcPath = resolve(src, entry.name)
		const destPath = resolve(dest, entry.name)
		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath)
			continue
		}
		await copyFile(srcPath, destPath)
	}
}

await rm(destDir, { recursive: true, force: true })
await copyDir(sourceDir, destDir)

await rm(destDirAnalytics, { recursive: true, force: true })
await copyDir(sourceDirAnalytics, destDirAnalytics)
