import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { discoverDesigns as labDiscover } from './discover-designs.mjs'

const lab = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const production = path.resolve(lab, '../sl-civic-archive')
const { discoverDesigns: productionDiscover } = await import(new URL('../../sl-civic-archive/scripts/discover-designs.mjs', import.meta.url))
const key = process.argv[2] ?? 'atelier'
if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new Error('Expected a Design folder key')
const source = path.join(lab, 'src/designs', key)
if (!fs.existsSync(path.join(source, 'index.ts'))) throw new Error(`Missing ${source}`)
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'loreforge-functional-dropin-'))
function discover(root, fn) {
  return fn({ designRoot: path.join(root, 'designs'), outputFile: path.join(root, 'generated/designKeys.ts'), publicRoot: path.join(root, 'public') })
}
try {
  const first = path.join(scratch, 'lab'), second = path.join(scratch, 'production'), returned = path.join(scratch, 'returned')
  fs.cpSync(source, path.join(first, 'designs', key), { recursive: true })
  // A generated manifest is optional: either host must reconstruct it.
  fs.rmSync(path.join(first, 'designs', key, 'design.manifest.json'), { force: true })
  discover(first, labDiscover)
  const local = path.join(first, 'designs', key, '.design-local')
  fs.mkdirSync(local, { recursive: true })
  fs.writeFileSync(path.join(local, 'lab-state.json'), '{"host":"lab"}')
  fs.writeFileSync(path.join(local, 'unfinished.ts'), 'THIS IS DELIBERATELY INVALID TYPESCRIPT')
  fs.cpSync(path.join(first, 'designs', key), path.join(second, 'designs', key), { recursive: true })
  fs.rmSync(path.join(second, 'designs', key, 'design.manifest.json'))
  assert.deepEqual(discover(second, productionDiscover).keys, [key])
  fs.writeFileSync(path.join(second, 'designs', key, '.design-local/production-state.json'), '{"host":"production"}')
  fs.cpSync(path.join(second, 'designs', key), path.join(returned, 'designs', key), { recursive: true })
  assert.deepEqual(discover(returned, labDiscover).keys, [key])
  for (const host of [lab, production]) {
    const config = JSON.parse(fs.readFileSync(path.join(host, 'tsconfig.json'), 'utf8'))
    assert(config.exclude.includes('src/designs/*/.design-local/**'), `${host} must ignore host-local scratch`)
    // Use the real compiler's file selection; no source hash comparison.
    const configFile = path.join(returned, `tsconfig-${path.basename(host)}.json`)
    fs.writeFileSync(configFile, JSON.stringify({ extends: path.join(host, 'tsconfig.json'), compilerOptions: { types: [] }, include: [path.join(returned, 'designs/**/*.ts'), path.join(returned, 'designs/**/*.tsx')], exclude: [path.join(returned, 'designs/*/.design-local/**')] }))
    const compiler = path.join(host, 'node_modules/typescript/bin/tsc')
    const result = spawnSync(process.execPath, [compiler, '--project', configFile, '--listFilesOnly'], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert(!result.stdout.includes('unfinished.ts'), 'host-local TypeScript entered the compilation')
  }
  console.log(`Functional round trip PASS: ${key}, Lab → production → Lab; regenerated manifests and assets; both hosts ignore scratch TypeScript.`)
} finally {
  // Only the unique temporary directory allocated above is removed.
  assert(path.dirname(scratch) === os.tmpdir() && path.basename(scratch).startsWith('loreforge-functional-dropin-'))
  fs.rmSync(scratch, { recursive: true, force: true })
}
