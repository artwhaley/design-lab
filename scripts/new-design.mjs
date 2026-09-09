/**
 * Create a production-shaped Design folder that can be discovered in the Lab
 * and copied unchanged into production. The generated presentation is small
 * on purpose, but it implements every current production slot.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const [key, name] = process.argv.slice(2)

function fail(message) {
  console.error(`\n❌ ${message}\n`)
  process.exit(1)
}

if (!key || !name) fail('Usage: npm run new-design -- <key> "<Name>"')
if (!/^[a-z][a-z0-9-]*$/.test(key)) fail('Design key must be lowercase kebab-case, e.g. "folder-parity-probe".')
if (key === '_template' || key === 'template') fail('The template key is reserved.')

const targetDir = join(root, 'src', 'designs', key)
if (existsSync(targetDir)) fail(`A Design already exists at src/designs/${key}.`)
const assetsDir = join(targetDir, 'assets')
mkdirSync(assetsDir, { recursive: true })

const configType = `${name.replace(/[^a-zA-Z0-9]+/g, '').replace(/^./, (c) => c.toUpperCase())}ConfigV1`
const configName = `${key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())}Config`
const constantName = `${key.replace(/-/g, '_').toUpperCase()}_DEFAULTS`
const safeName = name.replaceAll('`', '\\`').replaceAll("'", "\\'")
const description = `${name} — a production-shaped Design scaffold.`

writeFileSync(join(targetDir, 'design.manifest.json'), `${JSON.stringify({
  manifestVersion: 1,
  designContractVersion: 1,
  key,
  name,
  status: 'first-class',
  description,
  entry: './index.ts',
  preview: { thumbnail: 'assets/thumbnail.svg' },
}, null, 2)}\n`)

writeFileSync(join(targetDir, 'config.ts'), `import type { DesignDefinition } from '@/lib/design/types'

export type ${configType} = { accent: string }
export const ${constantName}: ${configType} = { accent: '#8ab8a1' }
const HEX = /^#[0-9a-fA-F]{6}$/

export const ${configName}: DesignDefinition<${configType}>['config'] = {
  version: 1,
  defaults: ${constantName},
  validate(raw) {
    if (!raw || typeof raw !== 'object' || typeof (raw as { accent?: unknown }).accent !== 'string' || !HEX.test((raw as { accent: string }).accent)) return { ok: false, errors: ['accent must be a 6-digit hex color.'] }
    return { ok: true, value: { accent: (raw as { accent: string }).accent } }
  },
  migrate(fromVersion, raw) { return fromVersion === 1 ? ${configName}.validate(raw) : { ok: false, errors: [\`Unsupported config version \${fromVersion}.\`] } },
  resolveTheme(config) {
    return { base: { primary: '#183027', secondary: '#2c5542', accent: config.accent, pageBg: '#f3f7f4', surfaceBg: '#ffffff', surfaceBorder: '#ccd8d0', textOnPrimary: '#ffffff', headingFont: 'Manrope, sans-serif', bodyFont: 'Manrope, sans-serif', mutedText: '#557066' }, vars: { '--${key}-accent': config.accent } }
  },
}
`)

writeFileSync(join(targetDir, 'index.ts'), `'use client'
import { createElement, type ChangeEvent, type ReactNode } from 'react'
import type { DesignDefinition } from '@/lib/design/types'
import type { DesignStudioEditorProps } from '@/lib/design/contracts'
import { ${configName}, type ${configType} } from './config'

function Shell({ children }: { children: ReactNode }) { return createElement('div', { style: { minHeight: '100%', padding: 24, fontFamily: 'var(--tenant-body-font)' } }, createElement('header', null, createElement('strong', null, '${safeName}')), createElement('main', null, children)) }
function Page({ title }: { title: string }) { return createElement('section', null, createElement('h1', null, title), createElement('p', null, 'Production-shaped ${safeName} surface.')) }
function Studio({ value, onChange }: DesignStudioEditorProps<${configType}>) { return createElement('label', null, 'Accent', createElement('input', { value: value.accent, onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ ...value, accent: event.target.value }) })) }
const studio: { Editor: typeof Studio } = { Editor: Studio }

export const design: DesignDefinition<${configType}> = {
  key: '${key}', status: 'first-class', name: '${safeName}', description: '${description}',
  preview: { thumbnail: '/design-assets/${key}/thumbnail.svg' }, config: ${configName}, studio,
  Shell,
  pages: {
    home: () => createElement(Page, { title: 'Home' }), records: () => createElement(Page, { title: 'Records' }), document: () => createElement(Page, { title: 'Document' }),
    departments: () => createElement(Page, { title: 'Departments' }), department: () => createElement(Page, { title: 'Department' }), about: () => createElement(Page, { title: 'About' }),
    lore: () => createElement(Page, { title: 'Lore' }), members: () => createElement(Page, { title: 'Members' }), work: () => createElement(Page, { title: 'Work' }),
    management: { departments: () => createElement(Page, { title: 'Manage Departments' }), folders: () => createElement(Page, { title: 'Manage Folders' }), roles: () => createElement(Page, { title: 'Manage Roles' }), documentTypes: () => createElement(Page, { title: 'Document Types' }), people: () => createElement(Page, { title: 'People' }), person: () => createElement(Page, { title: 'Person' }), invitations: () => createElement(Page, { title: 'Invitations' }) },
  },
}

export default design
`)

writeFileSync(join(assetsDir, 'thumbnail.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#183027"/><text x="32" y="190" fill="#8ab8a1" font-family="sans-serif" font-size="32">${name}</text></svg>\n`)

execFileSync(process.execPath, [join(root, 'scripts', 'discover-designs.mjs')], { cwd: root, stdio: 'inherit' })
console.log(`✅ Created and discovered src/designs/${key}/. Copy this folder unchanged to production after Lab validation.`)
