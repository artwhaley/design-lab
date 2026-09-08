import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const MIRRORED_FILES = [
  'src/lib/design/assets.ts',
  'src/lib/design/contracts.ts',
  'src/lib/design/fixtures.ts',
  'src/lib/design/types.ts',
  'src/lib/design/validate.ts',
  'src/lib/documents/lifecycle.ts',
  'src/lib/page-models/common.ts',
  'src/lib/page-models/departments.ts',
  'src/lib/page-models/document.ts',
  'src/lib/page-models/home.ts',
  'src/lib/page-models/info.ts',
  'src/lib/page-models/members.ts',
  'src/lib/page-models/records.ts',
  'src/lib/page-models/shell.ts',
  'src/lib/page-models/management/common.ts',
  'src/lib/page-models/management/departments.ts',
  'src/lib/page-models/management/documentTypes.ts',
  'src/lib/page-models/management/folders.ts',
  'src/lib/page-models/management/invitations.ts',
  'src/lib/page-models/management/people.ts',
  'src/lib/page-models/management/roles.ts',
  'src/lib/records/workspace/supersession.ts',
  'src/lib/records/workspace/types.ts',
  'src/lib/records/workspace/useRecordsWorkspace.ts',
  'src/components/functional/records/recordActions.tsx',
  'src/designs/shared/studio/fields.tsx',
]

function parseProduction() {
  const index = process.argv.indexOf('--production')
  const value = index >= 0 ? process.argv[index + 1] : null
  if (!value || value.startsWith('--')) throw new Error('Usage: node scripts/sync-production-contract.mjs --production <path> [--check]')
  return resolve(value)
}

function sha256(file) { return createHash('sha256').update(readFileSync(file)).digest('hex') }

const productionRoot = parseProduction()
const labRoot = resolve(process.cwd())
const check = process.argv.includes('--check')
const mismatches = []

for (const relativePath of MIRRORED_FILES) {
  const source = join(productionRoot, relativePath)
  const target = join(labRoot, relativePath)
  if (!existsSync(source)) {
    mismatches.push(`${relativePath}: missing in production checkout`)
    continue
  }
  if (!existsSync(target)) {
    if (check) mismatches.push(`${relativePath}: missing in Lab`)
    else { mkdirSync(join(target, '..'), { recursive: true }); copyFileSync(source, target) }
    continue
  }
  if (sha256(source) !== sha256(target)) {
    if (check) mismatches.push(`${relativePath}: production ${sha256(source)} != Lab ${sha256(target)}`)
    else copyFileSync(source, target)
  }
}

if (mismatches.length) {
  mismatches.forEach((mismatch) => console.error(`[production contract] ${mismatch}`))
  process.exitCode = 1
} else {
  console.log(`[production contract] ${check ? 'checked' : 'synced'} ${MIRRORED_FILES.length} allowlisted files`)
}
