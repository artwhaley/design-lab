import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')
const entries = []

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile()) {
      const relative = path.relative(root, full).replaceAll('\\', '/')
      const digest = createHash('sha256').update(readFileSync(full)).digest('hex')
      entries.push(`${relative}\0${digest}`)
    } else throw new Error(`Unsupported filesystem entry under ${full}`)
  }
}

walk(root)
process.stdout.write(entries.join('\n'))
