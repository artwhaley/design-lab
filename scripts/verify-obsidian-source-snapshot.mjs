import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'

const projectRoot = process.cwd()
const sourceRoot = resolve(projectRoot, 'src/designs/obsidian-lab/source')
const manifestPath = resolve(projectRoot, 'docs/remediation/obsidian-source-manifest.json')

function walk(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...walk(fullPath))
    else files.push(fullPath)
  }
  return files
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

if (!existsSync(manifestPath)) {
  console.error(`Missing source manifest: ${relative(projectRoot, manifestPath)}`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entries = Array.isArray(manifest.entries) ? manifest.entries : []
const failures = []
const expected = new Set()

for (const entry of entries) {
  const destination = resolve(projectRoot, entry.destinationPath)
  const relativeDestination = relative(sourceRoot, destination)
  if (relativeDestination.startsWith(`..${sep}`) || relativeDestination === '..') {
    failures.push(`outside protected root: ${entry.destinationPath}`)
    continue
  }
  expected.add(destination)
  if (!existsSync(destination)) {
    failures.push(`missing: ${entry.destinationPath}`)
    continue
  }
  const actual = sha256(destination)
  if (actual !== entry.sha256) failures.push(`modified: ${entry.destinationPath} (expected ${entry.sha256}, got ${actual})`)
}

if (existsSync(sourceRoot)) {
  for (const filePath of walk(sourceRoot)) {
    if (!expected.has(filePath)) failures.push(`unlisted: ${relative(projectRoot, filePath)}`)
  }
} else {
  failures.push(`missing protected root: ${relative(projectRoot, sourceRoot)}`)
}

if (failures.length > 0) {
  console.error(`Obsidian source snapshot verification failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Obsidian source snapshot verified: ${entries.length} protected files at ${manifest.frozenSha}`)
