import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()
const index = process.argv.indexOf('--production')
const production = index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : resolve(root, '..', 'sl-civic-archive')

execFileSync(process.execPath, [resolve(root, 'scripts', 'test-parity.mjs'), '--production', production], { cwd: root, stdio: 'inherit' })
console.log(`Current Obsidian source parity verified against ${production}`)
