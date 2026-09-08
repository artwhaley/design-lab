/**
 * T10 conformance suite — proves the Lab contract via the Contract Probe
 * reference Design, without Obsidian. Automates every acceptance item in the
 * ticket: registry uniqueness, required slots, defaults validation, migration,
 * base theme tokens, Shell/Studio existence, smoke renders for every required
 * surface (populated admin + empty visitor), interactive workspace
 * compatibility, and the shared functional placeholder inside the Shell.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { LabDesignDefinition, SurfaceKey } from '../contracts'
import { BASE_THEME_VARS, missingRequiredSlots, REQUIRED_DESIGN_SLOTS } from '../contracts'
import '../designs' // side-effect registration: contract-probe
import { getDesignDefinition, registerDesign } from '../designs/registry'
import { probeConfig } from '../designs/contract-probe/config'
import { buildScenario, type ScenarioSpec } from '../fixtures'
import { resolveDesignRuntime } from '../host/designRuntime'
import { PreviewPane } from '../host/PreviewPane'
import { ActionLog, FakeBackend } from '../workspaces'

const probe = (): LabDesignDefinition => getDesignDefinition('contract-probe') as LabDesignDefinition

function makeBackend(spec: ScenarioSpec): FakeBackend {
  return new FakeBackend(buildScenario(spec), new ActionLog(), 0)
}

function paneTestId(surface: SurfaceKey): string {
  return `conform-${surface.replace(/\./g, '-')}`
}

function renderPane(backend: FakeBackend, surface: SurfaceKey, params: Record<string, string | number> = {}) {
  const design = probe()
  const resolution = resolveDesignRuntime(design, probeConfig.defaults, null)
  if (!resolution.runtime) throw new Error('probe defaults must validate')
  const testId = paneTestId(surface)
  render(
    <PreviewPane
      testId={testId}
      design={design}
      builder={backend.builder}
      backend={backend}
      surface={surface}
      params={params}
      runtime={resolution.runtime}
      viewport={null}
      onNavigate={() => {}}
    />,
  )
  return screen.getByTestId(testId)
}

// The Contract Probe registers itself when `../designs` is imported above
// (vitest isolates each file, so the registry starts empty here and the
// side-effect registers it once). Tests below must NOT clear the registry
// between tests or the reference Design disappears.

describe('Contract Probe conformance — static contract', () => {

  it('registers exactly once under a unique key', () => {
    expect(probe()).toBeDefined()
    expect(() => probe()).not.toThrow()
    const design = probe()
    // duplicate registration must throw (registry uniqueness)
    expect(() => registerDesign(design as unknown as LabDesignDefinition)).toThrow(/Duplicate Design key/)
  })

  it('implements every required surface slot', () => {
    const design = probe()
    expect(missingRequiredSlots(design)).toEqual([])
    expect(REQUIRED_DESIGN_SLOTS.length).toBe(16)
  })

  it('validates defaults and rejects bad input', () => {
    const ok = probeConfig.validate(probeConfig.defaults)
    expect(ok.ok).toBe(true)
    const bad = probeConfig.validate({ density: 'huge', accent: 'blue', showDebugIds: 'yes' })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('migrates the current version and rejects unknown versions', () => {
    const current = probeConfig.migrate(1, probeConfig.defaults)
    expect(current.ok).toBe(true)
    const future = probeConfig.migrate(2, probeConfig.defaults)
    expect(future.ok).toBe(false)
  })

  it('resolves the full base theme token set', () => {
    const theme = probeConfig.resolveTheme(probeConfig.defaults)
    for (const token of Object.keys(BASE_THEME_VARS)) {
      expect(theme.base[token as keyof typeof theme.base]).toBeTruthy()
    }
    expect(theme.vars['--probe-density']).toBe('1')
  })

  it('provides Shell, Studio editor, and config contract', () => {
    const design = probe()
    expect(typeof design.Shell).toBe('function')
    expect(typeof design.studio.Editor).toBe('function')
    expect(design.config.version).toBe(1)
    expect(typeof design.config.validate).toBe('function')
    expect(typeof design.config.resolveTheme).toBe('function')
  })

  it('rejects invalid saved config at runtime with defaults fallback', () => {
    const design = probe()
    const resolution = resolveDesignRuntime(design, { density: 'nope' }, 1)
    expect(resolution.runtime).not.toBeNull()
    expect(resolution.errors.length).toBeGreaterThan(0)
    expect(resolution.runtime.config).toEqual(probeConfig.defaults)
  })
})

describe('Contract Probe conformance — populated Domain Admin smoke renders', () => {
  let backend: FakeBackend
  beforeEach(() => {
    backend = makeBackend({ persona: 'admin', dataState: 'populated' })
  })

  const CLASS_A_SURFACES: SurfaceKey[] = [
    'home',
    'records',
    'document',
    'departments',
    'department',
    'about',
    'lore',
    'members',
    'work',
    'management.departments',
    'management.folders',
    'management.roles',
    'management.documentTypes',
    'management.people',
    'management.person',
    'management.invitations',
  ]

  for (const surface of CLASS_A_SURFACES) {
    it(`renders ${surface} inside the Probe Shell`, () => {
      const pane = renderPane(backend, surface)
      expect(within(pane).getByTestId('probe-operating-context')).toBeInTheDocument()
      expect(within(pane).getByRole('heading', { level: 1 })).toBeInTheDocument()
      // every surface body renders a probe-page region
      expect(pane.querySelector('.probe-page')).not.toBeNull()
      // operating context appears exactly once (Bible §13)
      expect(pane.querySelectorAll('[data-testid="probe-operating-context"]')).toHaveLength(1)
    })
  }

  it('renders the shared functional placeholder inside the Shell', () => {
    const pane = renderPane(backend, 'shared.forms')
    expect(within(pane).getByTestId('probe-operating-context')).toBeInTheDocument()
    expect(within(pane).getByText(/shared functional surface/i)).toBeInTheDocument()
  })

  it('renders document with a real record and a realistic action set', () => {
    const pane = renderPane(backend, 'document')
    expect(within(pane).getByText(/supersession/i)).toBeInTheDocument()
    const actions = within(pane).queryAllByRole('button')
    expect(actions.length).toBeGreaterThan(0)
  })
})

describe('Contract Probe conformance — empty / limited variants', () => {
  let backend: FakeBackend
  beforeEach(() => {
    backend = makeBackend({ persona: 'visitor', dataState: 'empty' })
  })

  it('renders empty states instead of inventing content', () => {
    const pane = renderPane(backend, 'records')
    expect(within(pane).getByText(/no records match/i)).toBeInTheDocument()
  })

  it('renders limited surfaces with absence visible, not disguised', () => {
    const pane = renderPane(backend, 'work')
    expect(within(pane).getByText(/you do not have access to work/i)).toBeInTheDocument()
  })

  it('renders an empty home with empty record list state', () => {
    const pane = renderPane(backend, 'home')
    expect(within(pane).getByText(/no recent records/i)).toBeInTheDocument()
  })
})

describe('Contract Probe conformance — interactive workspace compatibility', () => {
  let backend: FakeBackend
  beforeEach(() => {
    backend = makeBackend({ persona: 'admin', dataState: 'populated' })
  })

  it('drives records search through the shared workspace', async () => {
    const pane = renderPane(backend, 'records')
    const before = backend.builder.visibleRecords().length
    expect(before).toBeGreaterThan(0)
    fireEvent.change(within(pane).getByLabelText(/search records/i), { target: { value: 'xylos' } })
    await waitFor(() => {
      expect(within(pane).queryByText(/no records match/i)).not.toBeInTheDocument()
    })
  })

  it('creates a folder through the Records dialog mutation', async () => {
    const pane = renderPane(backend, 'records')
    const countBefore = backend.builder.universe.folders.length
    fireEvent.click(within(pane).getByRole('button', { name: /^create folder/i }))
    const dialog = await within(pane).findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/name/i), { target: { value: 'Conformance Folder' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(countBefore + 1)
    })
  })

  it('selects a folder and scopes the result set', async () => {
    const pane = renderPane(backend, 'records')
    const firstFolder = backend.builder.universe.folders[0]
    fireEvent.click(within(pane).getByRole('button', { name: new RegExp(firstFolder.name) }))
    await waitFor(() => {
      expect(within(pane).getByRole('button', { name: new RegExp(firstFolder.name) }).parentElement).toHaveClass('probe-tree-active')
    })
  })

  it('executes a document lifecycle action through the bridge', async () => {
    const pane = renderPane(backend, 'document')
    const submit = within(pane).queryByRole('button', { name: /submit/i }) as HTMLButtonElement | null
    if (submit && !submit.disabled) {
      fireEvent.click(submit)
      await waitFor(() => {
        expect(backend.log.entries.some((e) => e.action === 'submit')).toBe(true)
      })
    } else {
      // fall back to a lock/unlock action (exactly one is offered per state,
      // since absent actions are filtered out of the toolbar)
      const lock = within(pane).queryByRole('button', { name: /lock/i }) as HTMLButtonElement | null
      expect(lock).not.toBeNull()
      fireEvent.click(lock!)
      await waitFor(() => {
        expect(backend.log.entries.some((e) => e.action === 'lock' || e.action === 'unlock')).toBe(true)
      })
    }
  })

  it('drives management folder create/rename through the management workspace', async () => {
    const pane = renderPane(backend, 'management.folders')
    const countBefore = backend.builder.universe.folders.length
    fireEvent.click(within(pane).getByRole('button', { name: /^create root folder$/i }))
    const dialog = await within(pane).findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/name/i), { target: { value: 'Mgmt Conformance' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^save$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(countBefore + 1)
    })
  })
})

describe('Contract Probe conformance — surfaces share one backend', () => {
  it('mutations in one pane are visible through the same backend', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const design = probe()
    const resolution = resolveDesignRuntime(design, probeConfig.defaults, null)
    if (!resolution.runtime) throw new Error('defaults must validate')

    // two panes over the same backend (compare mode)
    const panes = ['a', 'b'].map((side) => `conform-shared-${side}`)
    render(
      <div>
        <PreviewPane testId={panes[0]} design={design} builder={backend.builder} backend={backend} surface="records" params={{}} runtime={resolution.runtime} viewport={null} onNavigate={() => {}} />
        <PreviewPane testId={panes[1]} design={design} builder={backend.builder} backend={backend} surface="records" params={{}} runtime={resolution.runtime} viewport={null} onNavigate={() => {}} />
      </div>,
    )
    const first = screen.getByTestId(panes[0])
    const countBefore = backend.builder.universe.folders.length
    fireEvent.click(within(first).getByRole('button', { name: /^create folder/i }))
    const dialog = await within(first).findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/name/i), { target: { value: 'Shared Pane Folder' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(countBefore + 1)
    })
    // the second pane re-projects from the shared backend on its next refresh
    const second = screen.getByTestId(panes[1])
    fireEvent.click(within(second).getByRole('button', { name: /^all folders/i }))
    await waitFor(() => {
      expect(within(second).getByText(/shared pane folder/i)).toBeInTheDocument()
    })
  })
})

describe('Contract Probe conformance — Studio editor', () => {
  it('edits config through onChange and validates on save', () => {
    const design = probe()
    const Editor = design.studio.Editor
    const onChange = vi.fn()
    render(
      <Editor
        value={probeConfig.defaults}
        onChange={onChange}
        domain={{ name: 'Aster Reach', motto: 'Annotate, never edit', logoUrl: null }}
        uploadAsset={async (file, purpose) => ({ url: `blob:${file.name}/${purpose}` })}
      />,
    )
    fireEvent.change(screen.getByLabelText(/density/i), { target: { value: 'compact' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ density: 'compact' }))
    fireEvent.click(screen.getByLabelText(/show debug ids/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showDebugIds: true }))
  })
})
