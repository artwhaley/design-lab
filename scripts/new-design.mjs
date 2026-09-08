/**
 * new-design — scaffold a new Design from designs/_template.
 *
 *   npm run new-design -- <key> "<Name>"
 *
 * Copies the template folder, renames identifiers (Template/template →
 * Name/key), renames the CSS + component files, and prints the one remaining
 * source edit: registering the Design in src/designs/index.ts.
 *
 * The script never touches the host; the only required edit after copy is
 * static registry registration (Guardrail 10).
 */
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const templateDir = join(root, 'src', 'designs', '_template')

const [key, name] = process.argv.slice(2)

function fail(message) {
  console.error(`\n❌ ${message}\n`)
  process.exit(1)
}

if (!key || !name) fail('Usage: npm run new-design -- <key> "<Name>"\n  e.g. npm run new-design -- obsidian-lab "Obsidian Lab"')
if (!/^[a-z][a-z0-9-]*$/.test(key)) fail('Design key must be lowercase kebab-case, e.g. "obsidian-lab".')
if (key === '_template' || key === 'template') fail('The template key is reserved.')
if (!existsSync(templateDir)) fail('Template folder not found: src/designs/_template')

const targetDir = join(root, 'src', 'designs', key)
if (existsSync(targetDir)) fail(`A Design already exists at src/designs/${key}.`)

const pascal = name.replace(/[^a-zA-Z0-9]+/g, '').replace(/^./, (c) => c.toUpperCase())
const keyCamel = key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const scream = key.replace(/-/g, '_').toUpperCase()

// Specific-first replacement order; the generic lowercase `template` → key
// runs last so it never corrupts identifiers handled above.
const replacements = [
  ['<Name>', name],
  ['<key>', key],
  ['TEMPLATE_DEFAULTS', `${scream}_DEFAULTS`],
  ['TemplateConfigV1', `${pascal}ConfigV1`],
  ['templateDesign', `${keyCamel}Design`],
  ['templateConfig', `${keyCamel}Config`],
  ['Template', pascal],
  ['TEMPLATE', scream],
  ['template', key],
]

const fileRenames = [
  ['template.css', `${key}.css`],
  ['TemplateShell.tsx', `${pascal}Shell.tsx`],
  ['TemplateStudio.tsx', `${pascal}Studio.tsx`],
  ['TemplatePages.tsx', `${pascal}Pages.tsx`],
]

function rewrite(content) {
  for (const [from, to] of replacements) content = content.split(from).join(to)
  return content
}

cpSync(templateDir, targetDir, { recursive: true })

for (const entry of readdirSync(targetDir)) {
  const full = join(targetDir, entry)
  if (statSync(full).isFile()) {
    if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.css') || entry.endsWith('.md')) {
      writeFileSync(full, rewrite(readFileSync(full, 'utf8')))
    }
  }
  const rename = fileRenames.find(([from]) => from === entry)
  if (rename) {
    renameSync(full, join(targetDir, rename[1]))
  }
}

// Self-register the copied Design: the template's index only exports the
// definition (the _template must never appear in the registry), but the
// copied Design registers itself on import — so the only required source
// edit remains the single import in src/designs/index.ts.
const indexFile = join(targetDir, 'index.ts')
const indexSrc = readFileSync(indexFile, 'utf8')
if (!indexSrc.includes('register(')) {
  writeFileSync(indexFile, `${indexSrc.trimEnd()}\n\nimport { register } from '../registry'\nregister(${keyCamel}Design)\n`)
}

console.log(`\n✅ Created src/designs/${key}/ from _template.`)
console.log(`   Key: ${key} · Name: ${name} · Identifiers: ${pascal} / ${keyCamel} / ${scream}`)
console.log('\nNext steps:')
console.log(`   1. Register it in src/designs/index.ts:\n       import './${key}'`)
console.log('   2. Fill DESIGN_BRIEF.md, then replace every stub surface.')
console.log('   3. npm run build && npm test (conformance must pass).\n')