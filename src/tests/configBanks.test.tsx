import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { DesignConfigContract, LabDesignDefinition } from '../contracts'
import { resolveCssVars } from '../contracts'
import { resolveDesignRuntime } from '../host/designRuntime'
import { clearAllBanks, loadBank, saveBank } from '../host/configBanks'
import { StudioPanel } from '../host/StudioPanel'
import { makeStubDesign, stubConfig } from './helpers/stubDesign'

const domain = { name: 'Aster Reach', motto: 'Memory is the anchor.', logoUrl: '/media/lab-fixtures/aster-reach-logo.svg' }

describe('config banks', () => {
  beforeEach(() => clearAllBanks())

  it('round-trips per Design key independently', () => {
    saveBank('alpha', { version: 1, config: { accent: '#111111' } })
    saveBank('beta', { version: 1, config: { accent: '#222222' } })
    expect(loadBank('alpha')?.config).toEqual({ accent: '#111111' })
    expect(loadBank('beta')?.config).toEqual({ accent: '#222222' })
  })

  it('tolerates corrupt/missing banks', () => {
    expect(loadBank('ghost')).toBeNull()
    localStorage.setItem('lab.configBank.v1.corrupt', 'not-json')
    expect(loadBank('corrupt')).toBeNull()
  })
})

describe('runtime resolution', () => {
  it('defaults validate and resolve base theme tokens', () => {
    const design = makeStubDesign('stub-one', 'Stub One')
    const resolved = resolveDesignRuntime(design, design.config.defaults, null)
    expect(resolved.errors).toEqual([])
    const vars = resolveCssVars(resolved.runtime.theme)
    expect(vars['--tenant-accent']).toBe('#336699')
    expect(vars['--tenant-heading-font']).toBe('Georgia')
  })

  it('rejects invalid drafts with errors instead of accepting them', () => {
    const design = makeStubDesign('stub-one', 'Stub One')
    const resolved = resolveDesignRuntime(design, { accent: 42 }, null)
    expect(resolved.errors.length).toBeGreaterThan(0)
  })

  it('migrates older persisted versions', () => {
    const migrating: DesignConfigContract<{ accent: string }> = {
      version: 2,
      defaults: { accent: '#000000' },
      validate: (raw) => {
        if (raw && typeof raw === 'object' && typeof (raw as { accent?: unknown }).accent === 'string') {
          return { ok: true, value: { accent: (raw as { accent: string }).accent } }
        }
        return { ok: false, errors: ['invalid accent'] }
      },
      migrate: (fromVersion, raw) => {
        if (fromVersion === 1 && raw && typeof raw === 'object' && typeof (raw as { oldInk?: unknown }).oldInk === 'string') {
          return { ok: true, value: { accent: (raw as { oldInk: string }).oldInk } }
        }
        return migrating.validate(raw)
      },
      resolveTheme: (config) => ({ ...stubConfig.resolveTheme(config) }),
    }
    const design: LabDesignDefinition<{ accent: string }> = { ...makeStubDesign('mig', 'Mig'), config: migrating }
    const resolved = resolveDesignRuntime(design, { oldInk: '#abcdef' }, 1)
    expect(resolved.errors).toEqual([])
    expect(resolved.runtime.config.accent).toBe('#abcdef')
    expect(resolved.runtime.cssVars['--tenant-accent']).toBe('#abcdef')
  })
})

describe('studio panel', () => {
  it('renders the Design-owned editor with draft value', () => {
    const design = makeStubDesign('stub-one', 'Stub One')
    render(
      <StudioPanel
        design={design}
        draft={design.config.defaults}
        savedVersion={null}
        dirty={false}
        validationErrors={[]}
        domain={domain}
        uploadAsset={async () => ({ url: 'blob:preview' })}
        onChange={() => undefined}
        onSave={() => undefined}
        onRevert={() => undefined}
        onRestoreDefaults={() => undefined}
      />,
    )
    expect(screen.getByText(/Studio — Stub One/)).toBeInTheDocument()
    expect(screen.getByText(/^saved$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('shows validation errors and blocks Save', () => {
    const design = makeStubDesign('stub-one', 'Stub One')
    render(
      <StudioPanel
        design={design}
        draft={{ accent: 42 }}
        savedVersion={null}
        dirty
        validationErrors={['invalid accent']}
        domain={domain}
        uploadAsset={async () => ({ url: 'blob:preview' })}
        onChange={() => undefined}
        onSave={() => undefined}
        onRevert={() => undefined}
        onRestoreDefaults={() => undefined}
      />,
    )
    expect(screen.getByText(/invalid accent/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save/Revert/Defaults callbacks fire', () => {
    const design = makeStubDesign('stub-one', 'Stub One')
    const calls: string[] = []
    render(
      <StudioPanel
        design={design}
        draft={design.config.defaults}
        savedVersion={null}
        dirty
        validationErrors={[]}
        domain={domain}
        uploadAsset={async () => ({ url: 'blob:preview' })}
        onChange={() => calls.push('change')}
        onSave={() => calls.push('save')}
        onRevert={() => calls.push('revert')}
        onRestoreDefaults={() => calls.push('defaults')}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restore defaults' }))
    expect(calls).toEqual(['save', 'revert', 'defaults'])
  })
})