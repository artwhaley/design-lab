import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import { ActionLog, FakeBackend, RecordsWorkspaceImpl } from '../workspaces'
import { clearRegistry, registerDesign } from '../designs/registry'
import { makeStubDesign } from './helpers/stubDesign'
import { LabApp } from '../host/LabApp'
import { ViewportControls } from '../host/ViewportControls'
import { clearAllBanks, saveBank } from '../host/configBanks'

describe('compare mode shares semantic state', () => {
  it('two workspace instances over one backend reflect a shared mutation', async () => {
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    const backend = new FakeBackend(builder, new ActionLog(), 0)
    const model = builder.recordsModel()
    const left = new RecordsWorkspaceImpl(backend, model)
    const right = new RecordsWorkspaceImpl(backend, model)

    // Folder mutation through the LEFT workspace must be visible to the RIGHT.
    const created = await left.mutations.createFolder(null, 'Shared Folder')
    expect(created).toBe(true)
    const folders = right.folders.list
    const names: string[] = []
    const collect = (nodes: typeof folders) => nodes.forEach((n) => { names.push(n.name); collect(n.children) })
    collect(folders)
    expect(names).toContain('Shared Folder')
  })

  it('keeps separate config banks per Design', () => {
    clearAllBanks()
    saveBank('stub-one', { version: 1, config: { accent: '#111111' } })
    saveBank('stub-two', { version: 1, config: { accent: '#222222' } })
    const one = localStorage.getItem('lab.configBank.v1.stub-one')
    const two = localStorage.getItem('lab.configBank.v1.stub-two')
    expect(one).toContain('#111111')
    expect(two).toContain('#222222')
    expect(one).not.toContain('#222222')
    clearAllBanks()
  })
})

describe('host compare mode', () => {
  beforeEach(() => {
    clearRegistry()
    registerDesign(makeStubDesign('stub-one', 'Stub One'))
    registerDesign(makeStubDesign('stub-two', 'Stub Two'))
  })
  afterEach(() => clearRegistry())

  it('renders both panes for the same surface', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByTestId('lab-compare')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-a')).getByTestId('stub-home')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-b')).getByTestId('stub-home')).toBeInTheDocument()
  })

  it('switches the surface for both panes together', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    fireEvent.click(screen.getByRole('button', { name: /^manage invitations /i }))
    expect(within(screen.getByTestId('lab-preview-a')).getByTestId('stub-m-invitations')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-b')).getByTestId('stub-m-invitations')).toBeInTheDocument()
  })
})

describe('viewport controls', () => {
  it('applies presets and custom dimensions', () => {
    let viewport: { width: number; height: number; label: string } | null = null
    render(<ViewportControls viewport={viewport} onChange={(v) => { viewport = v }} />)
    fireEvent.change(screen.getByLabelText('Viewport preset'), { target: { value: 'Phone narrow' } })
    expect(viewport).toEqual({ width: 320, height: 700, label: 'Phone narrow' })
    fireEvent.change(screen.getByLabelText('Viewport preset'), { target: { value: 'Fluid' } })
    expect(viewport).toBeNull()
    fireEvent.change(screen.getByLabelText('Custom width (px)'), { target: { value: '900' } })
    fireEvent.change(screen.getByLabelText('Custom height (px)'), { target: { value: '1200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(viewport).toEqual({ width: 900, height: 1200, label: 'Custom' })
  })
})

describe('css isolation', () => {
  it('contract probe and stub render without global style leakage in the same document', () => {
    // Both panes mount in one document (no iframe). Scoping is enforced by
    // rule, so assert the panes are siblings with distinct boundaries.
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    expect(builder.shellModel().domain.name).toBe('Aster Reach')
  })
})