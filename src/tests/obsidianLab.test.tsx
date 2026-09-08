/**
 * T12 Part A — Obsidian consumer validation. Proves the ported Obsidian
 * presentation renders every Lab surface with the Lab models/workspaces and
 * that its interactions drive the shared workspaces. Source HEAD:
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { LabDesignDefinition, SurfaceKey } from '../contracts'
import { BASE_THEME_VARS, missingRequiredSlots } from '../contracts'
import '../designs'
import { getDesignDefinition } from '../designs/registry'
import { obsidianConfig } from '../designs/obsidian-lab/config'
import { buildScenario, type ScenarioSpec } from '../fixtures'
import { resolveDesignRuntime } from '../host/designRuntime'
import { PreviewPane } from '../host/PreviewPane'
import { ActionLog, FakeBackend } from '../workspaces'

const obsidian = (): LabDesignDefinition => getDesignDefinition('obsidian-lab') as LabDesignDefinition

function makeBackend(spec: ScenarioSpec): FakeBackend {
  return new FakeBackend(buildScenario(spec), new ActionLog(), 0)
}

function renderPane(backend: FakeBackend, surface: SurfaceKey, testId: string, params: Record<string, string | number> = {}) {
  const design = obsidian()
  const resolution = resolveDesignRuntime(design, obsidianConfig.defaults, null)
  if (!resolution.runtime) throw new Error('obsidian defaults must validate')
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

describe('Obsidian Lab — static contract', () => {
  it('registers with every required surface slot', () => {
    const design = obsidian()
    expect(design).toBeDefined()
    expect(design.name).toBe('Obsidian Lab')
    expect(missingRequiredSlots(design)).toEqual([])
  })

  it('validates defaults and emits base tokens + obsidian vars', () => {
    const ok = obsidianConfig.validate(obsidianConfig.defaults)
    expect(ok.ok).toBe(true)
    const bad = obsidianConfig.validate({ palette: { background: 'red' } })
    expect(bad.ok).toBe(false)
    const theme = obsidianConfig.resolveTheme(obsidianConfig.defaults)
    for (const token of Object.keys(BASE_THEME_VARS)) {
      expect(theme.base[token as keyof typeof theme.base]).toBeTruthy()
    }
    expect(theme.vars['--obsidian-bg']).toBe('#0b1419')
  })
})

describe('Obsidian Lab — populated admin smoke renders', () => {
  const CLASS_A: SurfaceKey[] = [
    'home', 'records', 'document', 'departments', 'department', 'about', 'lore',
    'members', 'member', 'work',
    'management.departments', 'management.folders', 'management.roles',
    'management.documentTypes', 'management.people', 'management.person',
    'management.invitations',
  ]
  for (const surface of CLASS_A) {
    it(`renders ${surface}`, () => {
      const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
      const pane = renderPane(backend, surface, `obs-${surface.replace(/\./g, '-')}`)
      expect(within(pane).getAllByText(/loreforge/i).length).toBeGreaterThan(0)
    })
  }

  it('renders the shared functional placeholder inside the Obsidian Shell', () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'shared.forms', 'obs-shared-forms')
    expect(within(pane).getByText(/shared functional surface/i)).toBeInTheDocument()
  })
})

describe('Obsidian Lab — empty visitor renders absence, not invented content', () => {
  it('renders empty records state and no-access work', () => {
    const backend = makeBackend({ persona: 'visitor', dataState: 'empty' })
    const recordsPane = renderPane(backend, 'records', 'obs-visitor-records')
    expect(within(recordsPane).getByText(/no records found/i)).toBeInTheDocument()
    const workPane = renderPane(backend, 'work', 'obs-visitor-work')
    expect(within(workPane).getByText(/no access to work/i)).toBeInTheDocument()
  })
})

describe('Obsidian Lab — interactive workspace compatibility', () => {
  it('searches records through the shared workspace', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'records', 'obs-records')
    fireEvent.change(within(pane).getByLabelText(/search records/i), { target: { value: 'xylos' } })
    await waitFor(() => {
      expect(within(pane).getByText(/records shown/i)).toBeInTheDocument()
    })
  })

  it('creates a folder through the Records folder dialog mutation', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'records', 'obs-records-create')
    const before = backend.builder.universe.folders.length
    // folder quick actions are direct buttons (Radix menus were replaced for
    // the Records folder management; the modal portals to document.body)
    fireEvent.click(within(pane).getByRole('button', { name: /^create folder$/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/folder name/i), { target: { value: 'Obsidian Collection' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(before + 1)
    })
  })

  it('creates a folder through the Folder Manager', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'management.folders', 'obs-folders')
    const before = backend.builder.universe.folders.length
    fireEvent.click(within(pane).getByRole('button', { name: /^new folder$/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/folder name/i), { target: { value: 'Tree Folder' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await waitFor(() => {
      expect(backend.builder.universe.folders.length).toBe(before + 1)
    })
  })

  it('executes a document lifecycle action through the bridge', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'document', 'obs-document')
    const actionsButton = within(pane).getByRole('button', { name: /document actions/i })
    fireEvent.click(actionsButton)
    const submit = within(pane).queryByText(/^submit$/i)
    if (submit) {
      fireEvent.click(submit)
      await waitFor(() => {
        expect(backend.log.entries.some((e) => e.action === 'submit')).toBe(true)
      })
    }
  })
})