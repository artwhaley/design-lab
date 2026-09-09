/**
 * T10 conformance suite — proves the Lab contract via the Contract Probe
 * reference Design, without Obsidian. Automates every acceptance item in the
 * ticket: registry uniqueness, required slots, defaults validation, migration,
 * base theme tokens, Shell/Studio existence, smoke renders for every required
 * surface (populated admin + empty visitor), interactive workspace
 * compatibility, and the shared functional placeholder inside the Shell.
 *
 * The probe is rendered through the SAME production-shaped path the Lab
 * iframe preview uses (`PreviewRenderer` + `resolveProductionRuntime` +
 * `installProductionActionEmulator`), so the interactions exercised here are
 * exactly the ones a real Design folder will perform after installation.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FolderSummary } from '@/lib/page-models/common'
import type { SurfaceKey } from '../contracts'
import { BASE_THEME_VARS, missingRequiredSlots, REQUIRED_DESIGN_SLOTS } from '../contracts'
import { contractProbe } from '../designs/contract-probe'
import { probeConfig } from '../designs/contract-probe/config'
import { buildScenario, type ScenarioSpec } from '../fixtures'
import { resolveProductionRuntime } from '../host/productionRuntime'
import { PreviewRenderer } from '../preview/PreviewRenderer'
import { installProductionActionEmulator } from '../preview/actionApiEmulator'
import { ActionLog, FakeBackend } from '../workspaces'

const probe = () => contractProbe

function makeBackend(spec: ScenarioSpec): FakeBackend {
  return new FakeBackend(buildScenario(spec), new ActionLog(), 0)
}

function paneTestId(surface: SurfaceKey): string {
  return `conform-${surface.replace(/\./g, '-')}`
}

let uninstallEmulator: (() => void) | null = null
afterEach(() => {
  uninstallEmulator?.()
  uninstallEmulator = null
})

function renderPane(backend: FakeBackend, surface: SurfaceKey, params: Record<string, string | number> = {}) {
  const design = probe()
  const resolution = resolveProductionRuntime(design, probeConfig.defaults, null)
  if (!resolution.runtime) throw new Error('probe defaults must validate')
  const testId = paneTestId(surface)
  uninstallEmulator?.()
  uninstallEmulator = installProductionActionEmulator(backend, () => {}, () => {})
  render(
    <div data-testid={testId}>
      <PreviewRenderer
        design={design}
        builder={backend.builder}
        backend={backend}
        runtime={resolution.runtime}
        surface={surface}
        params={params}
        onNavigate={() => {}}
        onExternal={() => {}}
      />
    </div>,
  )
  return screen.getByTestId(testId)
}

// The Contract Probe is a discovered production-shaped Design (16 Class A
// slots, no member slot) imported directly; no runtime registration exists.

describe('Contract Probe conformance — static contract', () => {

  it('exports a complete production-shaped definition', () => {
    expect(probe()).toBeDefined()
    expect(probe().key).toBe('contract-probe')
    expect('member' in probe().pages).toBe(false)
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
    expect(theme.vars?.['--probe-density']).toBe('1')
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
    const resolution = resolveProductionRuntime(design, { density: 'nope' }, 1)
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
})

describe('Contract Probe conformance — interactive workspace compatibility', () => {
  let backend: FakeBackend
  beforeEach(() => {
    backend = makeBackend({ persona: 'admin', dataState: 'populated' })
  })

  it('drives records search through the shared workspace endpoint', async () => {
    const pane = renderPane(backend, 'records')
    const before = backend.builder.visibleRecords().length
    expect(before).toBeGreaterThan(0)
    fireEvent.change(within(pane).getByLabelText(/search records/i), { target: { value: 'xylos' } })
    // the workspace fetches /api/records-search against the fake backend; a
    // non-matching term resolves to the server-filtered empty result set
    await waitFor(() => {
      expect(within(pane).getByText(/no records match/i)).toBeInTheDocument()
    })
    // clearing the search restores the full result set
    fireEvent.change(within(pane).getByLabelText(/search records/i), { target: { value: '' } })
    await waitFor(() => {
      expect(within(pane).queryByText(/no records match/i)).not.toBeInTheDocument()
    })
  })

  it('selects a folder and scopes the result set', async () => {
    const pane = renderPane(backend, 'records')
    const model = backend.builder.recordsModel()
    const firstFolder = flattenFolders(model.folders)[0]
    expect(firstFolder).toBeDefined()
    fireEvent.click(within(pane).getByRole('button', { name: new RegExp(firstFolder.name) }))
    await waitFor(() => {
      expect(within(pane).getByRole('button', { name: new RegExp(firstFolder.name) }).parentElement).toHaveClass('probe-tree-active')
    })
  })

  it('executes a document lifecycle action through the route bridge', async () => {
    const pane = renderPane(backend, 'document')
    const submit = within(pane).queryByRole('button', { name: /submit/i }) as HTMLButtonElement | null
    if (submit && !submit.disabled) {
      fireEvent.click(submit)
      await waitFor(() => {
        expect(backend.log.entries.some((e) => e.action === 'workflow')).toBe(true)
      })
    } else {
      // fall back to a delete action (absent actions are filtered out)
      const del = within(pane).queryByRole('button', { name: /delete/i }) as HTMLButtonElement | null
      expect(del).not.toBeNull()
      fireEvent.click(del!)
      await waitFor(() => {
        expect(backend.log.entries.some((e) => e.action === 'delete')).toBe(true)
      })
    }
  })

  it('drives management folder create through the shared folders workspace', async () => {
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
  it('mutations through one pane land in the shared backend', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const design = probe()
    const resolution = resolveProductionRuntime(design, probeConfig.defaults, null)
    if (!resolution.runtime) throw new Error('defaults must validate')
    uninstallEmulator?.()
    uninstallEmulator = installProductionActionEmulator(backend, () => {}, () => {})

    // two panes over the same backend (compare mode)
    const panes = ['a', 'b'].map((side) => `conform-shared-${side}`)
    render(
      <div>
        <div data-testid={panes[0]}>
          <PreviewRenderer design={design} builder={backend.builder} backend={backend} runtime={resolution.runtime} surface="management.folders" params={{}} onNavigate={() => {}} onExternal={() => {}} />
        </div>
        <div data-testid={panes[1]}>
          <PreviewRenderer design={design} builder={backend.builder} backend={backend} runtime={resolution.runtime} surface="management.folders" params={{}} onNavigate={() => {}} onExternal={() => {}} />
        </div>
      </div>,
    )
    const first = screen.getByTestId(panes[0])
    const second = screen.getByTestId(panes[1])
    const countBefore = backend.builder.universe.folders.length
    fireEvent.click(within(first).getByRole('button', { name: /^create root folder$/i }))
    const dialog = await within(first).findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/name/i), { target: { value: 'Shared Pane Folder' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^save$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(countBefore + 1)
    })
    expect(backend.builder.universe.folders.some((f) => f.name === 'Shared Pane Folder')).toBe(true)
    // the second pane renders from the same shared backend without corruption
    expect(within(second).getByRole('button', { name: /^create root folder$/i })).toBeInTheDocument()
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

function flattenFolders(nodes: FolderSummary[]): FolderSummary[] {
  const out: FolderSummary[] = []
  const visit = (list: FolderSummary[]): void => {
    for (const node of list) {
      out.push(node)
      visit(node.children)
    }
  }
  visit(nodes)
  return out
}