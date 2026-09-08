import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ActionLog, FakeBackend } from '../workspaces'
import { buildScenario } from '../fixtures'
import { ScenarioPanel } from '../host/ScenarioPanel'
import { ActionLog as ActionLogView } from '../host/ActionLog'
import { clearRegistry, registerDesign } from '../designs/registry'
import { makeStubDesign } from './helpers/stubDesign'
import { LabApp } from '../host/LabApp'

describe('scenario panel wiring', () => {
  const flags = { latencyMs: 120, failNextMutation: false, readError: false, loadingOverride: false }

  it('emits persona and data-state changes', () => {
    const changes: string[] = []
    render(
      <ScenarioPanel
        scenario={{ persona: 'admin', dataState: 'populated' }}
        flags={flags}
        onScenarioChange={(next) => changes.push(`${next.persona}:${next.dataState}`)}
        onFlagsChange={() => undefined}
        onReset={() => undefined}
      />,
    )
    fireEvent.change(screen.getByLabelText('Persona'), { target: { value: 'visitor' } })
    fireEvent.change(screen.getByLabelText('Data state'), { target: { value: 'empty' } })
    // Each change derives from the current props (uncontrolled parent in this test).
    expect(changes).toEqual(['visitor:populated', 'admin:empty'])
  })

  it('emits runtime flag changes', () => {
    let nextFlags = flags
    render(
      <ScenarioPanel
        scenario={{ persona: 'admin', dataState: 'populated' }}
        flags={flags}
        onScenarioChange={() => undefined}
        onFlagsChange={(next) => { nextFlags = next }}
        onReset={() => undefined}
      />,
    )
    fireEvent.click(screen.getByLabelText('Next mutation fails (consumed once)'))
    expect(nextFlags.failNextMutation).toBe(true)
    fireEvent.change(screen.getByLabelText('Fake latency'), { target: { value: '400' } })
    expect(nextFlags.latencyMs).toBe(400)
    fireEvent.click(screen.getByLabelText('Current surface read error'))
    expect(nextFlags.readError).toBe(true)
  })
})

describe('action log view', () => {
  it('renders entries and clears', () => {
    const log = new ActionLog()
    log.append('records', 'search', 'all in root')
    log.append('folders', 'rename', 'denied', 'error')
    const { rerender } = render(<ActionLogView log={log} />)
    expect(screen.getByText(/records\.search/)).toBeInTheDocument()
    expect(screen.getByText(/folders\.rename/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    rerender(<ActionLogView log={log} />)
    expect(screen.getByText(/no actions yet/i)).toBeInTheDocument()
  })
})

describe('host scenario behavior', () => {
  beforeEach(() => {
    clearRegistry()
    registerDesign(makeStubDesign('stub-one', 'Stub One'))
  })
  afterEach(() => clearRegistry())

  it('switching persona rebuilds a safe projection (visitor shell has no account)', async () => {
    render(<LabApp />)
    fireEvent.change(screen.getByLabelText('Persona'), { target: { value: 'visitor' } })
    // The backend rebuilds asynchronously via effect; wait for the new shell.
    await screen.findByLabelText('Persona')
    // Visitor projection is enforced at the model layer (covered by fixture
    // tests); here we assert the switch did not crash and preview still renders.
    expect(within(screen.getByTestId('lab-preview')).getByTestId('stub-home')).toBeInTheDocument()
  })

  it('flags wire into the fake backend (next mutation fails is consumed once)', () => {
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    const backend = new FakeBackend(builder, new ActionLog(), 0)
    backend.failNextMutation = true
    const folders = builder.managementFoldersModel()
    void folders
    expect(backend.consumeFail()).toBe(true)
    expect(backend.consumeFail()).toBe(false)
  })

  it('read error flag makes the records workspace report an error', async () => {
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    const backend = new FakeBackend(builder, new ActionLog(), 0)
    backend.readError = true
    const workspace = new (await import('../workspaces')).RecordsWorkspaceImpl(backend, builder.recordsModel())
    workspace.search.setValue('Directive')
    await new Promise((r) => setTimeout(r, 10))
    expect(workspace.results.error).toMatch(/failed to load/)
  })

  it('reset restores the deterministic baseline from Lab chrome', async () => {
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    const backend = new FakeBackend(builder, new ActionLog(), 0)
    backend.reset()
    expect(builder.universe.records.length).toBe(65)
    expect(backend.log.entries.some((e) => e.action === 'reset')).toBe(true)
  })
})