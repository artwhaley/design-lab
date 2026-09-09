import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

function fail(message) {
  console.error(`[design parity] ${message}`)
  process.exitCode = 1
}

function requiredPath(name) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : null
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`)
  return resolve(value)
}

function digest(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function filesUnder(root) {
  const entries = new Map()
  if (!existsSync(root)) return entries
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (entry.isFile()) entries.set(relative(root, full).replaceAll('\\', '/'), { file: full, sha256: digest(full), bytes: statSync(full).size })
      else throw new Error(`Unsupported filesystem entry: ${full}`)
    }
  }
  visit(root)
  return entries
}

function compareTrees(label, leftRoot, rightRoot) {
  const left = filesUnder(leftRoot)
  const right = filesUnder(rightRoot)
  const paths = [...new Set([...left.keys(), ...right.keys()])].sort()
  const differences = []
  for (const path of paths) {
    const a = left.get(path)
    const b = right.get(path)
    if (!a || !b) differences.push(`${label}: ${path} is ${a ? 'missing on Lab' : 'missing in production'}`)
    else if (a.sha256 !== b.sha256 || a.bytes !== b.bytes) differences.push(`${label}: ${path} differs (production ${a.sha256}/${a.bytes}, Lab ${b.sha256}/${b.bytes})`)
  }
  return differences
}

function compareAssetMaterialization(label, sourceRoot, materializedRoot) {
  return compareTrees(label, sourceRoot, materializedRoot)
}

try {
  const productionRoot = requiredPath('--production')
  const labRoot = resolve(process.cwd())
  const productionDesign = join(productionRoot, 'src', 'designs', 'obsidian')
  const labDesign = join(labRoot, 'src', 'designs', 'obsidian')
  const differences = [
    ...compareTrees('Obsidian folder', productionDesign, labDesign),
  ]

  if (process.argv.includes('--check-assets')) {
    const productionAssets = join(productionDesign, 'assets')
    differences.push(...compareAssetMaterialization('Lab bundled assets', productionAssets, join(labRoot, 'public', 'design-assets', 'obsidian')))
    const productionMaterialized = join(productionRoot, 'public', 'design-assets', 'obsidian')
    if (existsSync(productionMaterialized)) differences.push(...compareAssetMaterialization('Production bundled assets', productionAssets, productionMaterialized))
  }

  const count = filesUnder(productionDesign).size
  if (count === 0) {
    fail('Obsidian folder is empty or missing — an empty folder must never pass parity (0-file false pass)')
  } else if (differences.length) {
    differences.forEach((difference) => console.error(`- ${difference}`))
    fail(`${differences.length} difference(s) found`)
  } else {
    console.log(`[design parity] Obsidian source parity: PASS (${count} files)`)
    if (process.argv.includes('--check-assets')) console.log('[design parity] bundled asset materialization: PASS')
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
