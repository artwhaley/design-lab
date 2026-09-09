import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import type { DesignKey, DesignDefinition } from '@/lib/design/types'
import type { DesignConfigContract } from '../contracts'

import {
  CLASS_A_KEYS,
  CLASS_B_KEYS,
  COMPAT_KEYS,
  LAB_CONTRACT_VERSION,
  REQUIRED_DESIGN_SLOTS,
  SURFACE_CATALOG,
  missingRequiredSlots,
  resolveCssVars,
  surfaceByKey,
} from '../contracts'
import { getDesignDefinition } from '@/lib/design/generated/registry'

const stub: ComponentType<any> = () => null

const stubConfig: DesignConfigContract<{ accent: string }> = {
  version: 1,
  defaults: { accent: '#336699' },
  validate: (raw) => {
    if (raw && typeof raw === 'object' && typeof (raw as { accent?: unknown }).accent === 'string') {
      return { ok: true, value: { accent: (raw as { accent: string }).accent } }
    }
    return { ok: false, errors: ['invalid accent'] }
  },
  migrate: (_from, raw) => stubConfig.validate(raw),
  resolveTheme: (config) => ({
    base: {
      primary: '#123456', secondary: '#234567', accent: config.accent,
      pageBg: '#ffffff', surfaceBg: '#f5f5f5', surfaceBorder: '#dddddd',
      textOnPrimary: '#ffffff', headingFont: 'Georgia', bodyFont: 'Arial', mutedText: '#666666',
    },
    vars: {},
  }),
}

function fullDesign(): DesignDefinition {
  return {
    key: 'test-design' as DesignKey,
    status: 'first-class',
    name: 'Test Design',
    description: 'contract test fixture',
    preview: { thumbnail: '/design-assets/test-design/thumbnail.svg' },
    config: stubConfig,
    studio: { Editor: stub },
    Shell: stub,
    pages: {
      home: stub,
      records: stub,
      document: stub,
      departments: stub,
      department: stub,
      about: stub,
      lore: stub,
      members: stub,
      work: stub,
      management: {
        departments: stub,
        folders: stub,
        roles: stub,
        documentTypes: stub,
        people: stub,
        person: stub,
        invitations: stub,
      },
    },
  }
}

describe('contract version', () => {
  it('is frozen', () => {
    expect(LAB_CONTRACT_VERSION).toBe('2026-09-management-v1')
  })
})

describe('surface catalog', () => {
  it('enumerates exactly the required Class A slots', () => {
    expect(CLASS_A_KEYS).toHaveLength(16)
    expect(CLASS_A_KEYS).toEqual(REQUIRED_DESIGN_SLOTS)
  })

  it('enumerates seven Class B shared surfaces', () => {
    expect(CLASS_B_KEYS).toEqual([
      'shared.forms', 'shared.templates', 'shared.import', 'shared.documentEdit',
      'shared.documentHistory', 'shared.pageEdit', 'shared.siteStudio',
    ])
  })

  it('models the two compatibility routes', () => {
    expect(COMPAT_KEYS).toEqual(['compat.review', 'compat.subdomains'])
  })

  it('every Class A surface declares a design slot and unique keys', () => {
    const keys = new Set<string>()
    for (const surface of SURFACE_CATALOG) {
      expect(keys.has(surface.key)).toBe(false)
      keys.add(surface.key)
      if (surface.kind === 'classA') expect(surface.designSlot).toBeTruthy()
    }
  })

  it('surfaceByKey resolves and rejects unknown keys', () => {
    expect(surfaceByKey('records').label).toBe('Records')
    expect(() => surfaceByKey('nope' as never)).toThrow(/Unknown Lab surface/)
  })
})

describe('generated registry', () => {
  it('resolves discovered designs and rejects unknown keys', () => {
    expect(getDesignDefinition('obsidian')?.key).toBe('obsidian')
    expect(getDesignDefinition('contract-probe')?.key).toBe('contract-probe')
    expect(getDesignDefinition('nope')).toBeUndefined()
  })

  it('exposes every discovered design with no invented member slot', () => {
    for (const definition of [getDesignDefinition('obsidian'), getDesignDefinition('contract-probe')]) {
      expect(definition).toBeTruthy()
      expect('member' in (definition?.pages ?? {})).toBe(false)
      expect(Object.keys(definition?.pages ?? {})).toEqual(expect.arrayContaining(REQUIRED_DESIGN_SLOTS.filter((slot) => !slot.includes('management.'))))
    }
  })
})

describe('requiredness', () => {
  it('complete design has no missing slots', () => {
    expect(missingRequiredSlots(fullDesign())).toEqual([])
  })

  it('an incomplete definition is rejected by conformance', () => {
    const design = fullDesign()
    const incomplete = {
      ...design,
      pages: {
        ...design.pages,
        work: undefined,
        management: {
          departments: stub, folders: stub, roles: stub, documentTypes: stub,
          people: stub, person: stub,
          // invitations omitted
        },
      },
    } as unknown as DesignDefinition
    const missing = missingRequiredSlots(incomplete)
    expect(missing).toContain('work')
    expect(missing).toContain('management.invitations')
  })

  it('required slots are type-enforced on DesignDefinition', () => {
    const design = fullDesign()
    const incomplete: DesignDefinition = {
      ...design,
      pages: {
        ...design.pages,
        management: {
          departments: stub, folders: stub, documentTypes: stub,
          people: stub, person: stub, invitations: stub,
          // @ts-expect-error — management.roles is required for a first-class Design
          roles: undefined,
        },
      },
    }
    expect(incomplete.pages.management.roles).toBeUndefined()
  })
})

describe('theme resolution', () => {
  it('maps base tokens to --tenant-* css vars and passes design vars through', () => {
    const theme = stubConfig.resolveTheme({ accent: '#aabbcc' })
    const vars = resolveCssVars({ ...theme, vars: { '--probe-glow': 'rgba(0,0,0,0.2)' } })
    expect(vars['--tenant-primary']).toBe('#123456')
    expect(vars['--tenant-accent']).toBe('#aabbcc')
    expect(vars['--probe-glow']).toBe('rgba(0,0,0,0.2)')
  })
})

describe('snapshot purity', () => {
  const contractsDir = join(process.cwd(), 'src', 'contracts')

  it('no contract file imports production/server modules', () => {
    const forbidden = ['payload', 'next/', '@/lib/', '@/app/', 'node:', '@syncfusion', 'react-arborist']
    for (const file of readdirSync(contractsDir)) {
      if (!file.endsWith('.ts')) continue
      const source = readFileSync(join(contractsDir, file), 'utf8')
      for (const token of forbidden) {
        expect(source, `${file} must not import ${token}`).not.toContain(`from '${token}`)
        expect(source, `${file} must not import ${token}`).not.toContain(`from "${token}`)
      }
    }
  })
})
