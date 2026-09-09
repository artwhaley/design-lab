import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative, resolve } from 'node:path'

const labRoot = resolve(process.cwd())
const productionIndex = process.argv.indexOf('--production')
const productionValue = productionIndex >= 0 ? process.argv[productionIndex + 1] : null
if (!productionValue || productionValue.startsWith('--')) {
  console.error('Usage: npm run test:parity -- --production <path>')
  process.exit(1)
}
const productionRoot = resolve(productionValue)

function fail(message) {
  throw new Error(`[parity gate] ${message}`)
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function filesUnder(root) {
  const files = new Map()
  if (!existsSync(root)) return files
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (entry.isFile()) files.set(relative(root, full).replaceAll('\\', '/'), { file: full, bytes: statSync(full).size, sha256: sha256(full) })
      else fail(`unsupported entry under ${root}: ${entry.name}`)
    }
  }
  visit(root)
  return files
}

function compareTrees(label, productionPath, labPath) {
  const production = filesUnder(productionPath)
  const lab = filesUnder(labPath)
  const paths = [...new Set([...production.keys(), ...lab.keys()])].sort()
  const differences = []
  for (const path of paths) {
    const left = production.get(path)
    const right = lab.get(path)
    if (!left || !right) differences.push(`${label}: ${path} is ${left ? 'missing in Lab' : 'missing in production'}`)
    else if (left.bytes !== right.bytes || left.sha256 !== right.sha256) differences.push(`${label}: ${path} differs`)
  }
  return differences
}

function runNode(script, args) {
  execFileSync(process.execPath, [join(labRoot, 'scripts', script), ...args], { cwd: labRoot, stdio: 'inherit' })
}

try {
  if (!existsSync(productionRoot)) fail(`production checkout does not exist: ${productionRoot}`)
  const productionDesign = join(productionRoot, 'src', 'designs', 'obsidian')
  const labDesign = join(labRoot, 'src', 'designs', 'obsidian')
  const differences = []

  differences.push(...compareTrees('Obsidian source', productionDesign, labDesign))
  differences.push(...compareTrees('Obsidian materialized assets', join(productionRoot, 'public', 'design-assets', 'obsidian'), join(labRoot, 'public', 'design-assets', 'obsidian')))

  const productionManifest = JSON.parse(readFileSync(join(productionDesign, 'design.manifest.json'), 'utf8'))
  const labManifest = JSON.parse(readFileSync(join(labDesign, 'design.manifest.json'), 'utf8'))
  if (JSON.stringify(productionManifest) !== JSON.stringify(labManifest)) differences.push('Obsidian manifest JSON differs')

  if (existsSync(join(labRoot, 'src', 'designs', 'obsidian-lab'))) differences.push('obsolete src/designs/obsidian-lab directory still exists')
  if (existsSync(join(labRoot, 'src', 'designs', 'index.ts'))) differences.push('obsolete src/designs/index.ts hand-maintained registry still exists')
  const registrySource = readFileSync(join(labRoot, 'src', 'lib', 'design', 'generated', 'registry.ts'), 'utf8')
  if (!registrySource.includes("@/designs/obsidian")) differences.push('generated registry does not import production Obsidian')
  if (registrySource.includes('obsidian-lab')) differences.push('generated registry references obsolete obsidian-lab')

  const surfaceSource = readFileSync(join(labRoot, 'src', 'contracts', 'surfaces.ts'), 'utf8')
  if (/key:\s*['"]member['"]/.test(surfaceSource)) differences.push('surface catalog contains obsolete member surface')
  const requiredSlots = [...surfaceSource.matchAll(/'([^']+)'/g)].map((match) => match[1])
  if (requiredSlots.includes('member')) differences.push('required production slot list contains obsolete member slot')

  if (differences.length) {
    differences.forEach((difference) => console.error(`- ${difference}`))
    fail(`${differences.length} structural difference(s) found`)
  }

  runNode('sync-production-contract.mjs', ['--production', productionRoot, '--check'])
  runNode('discover-designs.mjs', ['--check'])
  console.log(`[parity gate] PASS: production contract, generated registry, Obsidian source, assets, and surface seams are aligned`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
