/**
 * T12 Part A — Obsidian consumer validation. Proves the ported Obsidian
 * presentation renders every Lab surface with the Lab models/workspaces and
 * that its interactions drive the shared workspaces. Source HEAD:
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { LabDesignDefinition, SurfaceKey } from '../contracts'
import { BASE_THEME_VARS, missingRequiredSlots } from '../contracts'
import '../designs'
import { DocumentAdapter } from '../designs/obsidian-lab/adapters/DocumentAdapter'
import { getDesignDefinition } from '../designs/registry'
import { obsidianConfig } from '../designs/obsidian-lab/config'
import { buildScenario, type ScenarioSpec } from '../fixtures'
import { resolveDesignRuntime } from '../host/designRuntime'
import { PreviewPane } from '../host/PreviewPane'
import { ActionLog, DocumentActionBridgeImpl, FakeBackend } from '../workspaces'

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
      expect(within(pane).getByText(/\d+ records$/i)).toBeInTheDocument()
    })
  })

  it('selects a source records folder through the shared workspace', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'records', 'obs-records-folder')
    const folderId = backend.builder.universe.folders.find((folder) => folder.name === 'Colonies')!.id
    const folderButton = within(pane).getAllByRole('button', { name: /Colonies/i }).find((button) => button.textContent?.includes('12'))
    if (!folderButton) throw new Error('Colonies folder button did not render')
    fireEvent.click(folderButton)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(backend.log.entries.some((entry) => entry.scope === 'records.folderSelect' && entry.action === 'query' && entry.detail.includes(`in ${folderId}`))).toBe(true)
  })

  it('creates a folder through the Records folder dialog mutation', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'records', 'obs-records-create')
    const before = backend.builder.universe.folders.length
    const menuButton = within(pane).getByRole('button', { name: /folder management/i })
    fireEvent.keyDown(menuButton, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('menuitem', { name: /^create folder$/i }))
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
    expect(dialog).not.toBeNull()
    if (!dialog) throw new Error('Create folder dialog did not open')
    const nameInput = within(dialog).getByLabelText(/folder name/i)
    fireEvent.change(nameInput, { target: { value: 'Obsidian Collection' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(backend.builder.universe.folders.length).toBe(before + 1)
  })

  it('creates a folder through the Folder Manager', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'management.folders', 'obs-folders')
    const before = backend.builder.universe.folders.length
    fireEvent.click(within(pane).getByRole('button', { name: /^new folder$/i }))
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement | null
    expect(dialog).not.toBeNull()
    if (!dialog) throw new Error('New folder dialog did not open')
    fireEvent.change(within(dialog).getByLabelText(/folder name/i), { target: { value: 'Tree Folder' } })
    fireEvent.submit(within(dialog).getByRole('button', { name: /^create$/i }).closest('form')!)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(backend.builder.universe.folders.length).toBe(before + 1)
  })

  it('updates the source document-type inspector from a Lab selection', () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const pane = renderPane(backend, 'management.documentTypes', 'obs-types-selection')
    const typeName = backend.builder.universe.documentTypes.find((type) => type.name === 'Survey Report')!.name
    fireEvent.click(within(pane).getAllByText(typeName)[0]!)
    expect(within(pane).getByRole('heading', { name: typeName })).toBeInTheDocument()
    expect(within(pane).queryByText(/choose a document type/i)).not.toBeInTheDocument()
  })

  it('preserves visitor action absence at the source boundary', () => {
    const backend = makeBackend({ persona: 'visitor', dataState: 'populated' })
    const recordsPane = renderPane(backend, 'records', 'obs-visitor-records-actions')
    expect(within(recordsPane).queryByRole('button', { name: /folder management/i })).not.toBeInTheDocument()
    const documentPane = renderPane(backend, 'document', 'obs-visitor-document-actions')
    const actionsButton = within(documentPane).getByRole('button', { name: /document actions/i })
    fireEvent.keyDown(actionsButton, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: /^view record$/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /^edit$/i })).not.toBeInTheDocument()
  })

  it('executes a source document action through the bridge', async () => {
    const backend = makeBackend({ persona: 'admin', dataState: 'populated' })
    const design = obsidian()
    const resolution = resolveDesignRuntime(design, obsidianConfig.defaults, null)
    if (!resolution.runtime) throw new Error('obsidian defaults must validate')
    const recordId = backend.builder.defaultRecordId()!
    const bridge = new DocumentActionBridgeImpl(backend, backend.builder.documentModel(recordId))
    const run = vi.spyOn(bridge, 'run').mockResolvedValue({ ok: true, message: 'ok' })
    render(<DocumentAdapter model={backend.builder.documentModel(recordId)} runtime={resolution.runtime as never} actions={bridge} />)
    const pane = document.querySelector('[class*="documentPage"]') as HTMLElement
    const actionsButton = within(pane).getByRole('button', { name: /document actions/i })
    fireEvent.keyDown(actionsButton, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(actionsButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('menuitem', { name: /^view record$/i }))
    expect(run).toHaveBeenCalledWith('view')
  })
})
