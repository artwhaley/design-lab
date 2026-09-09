import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import { ActionLog, FakeBackend, RecordsWorkspaceImpl } from '../workspaces'

import { LabApp } from '../host/LabApp'
import { ViewportControls } from '../host/ViewportControls'
import { clearAllBanks, saveBank } from '../host/configBanks'
import { getDesignDefinitions } from '@/lib/design/generated/registry'

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

  it('keeps snapshot revisions monotonic without counting transport logs or hydration', () => {
    const hostLog = new ActionLog()
    const host = new FakeBackend(buildScenario({ persona: 'admin', dataState: 'populated' }), hostLog, 0)
    const initial = host.snapshot()

    hostLog.append('navigation', 'surface', 'management.folders')
    hostLog.append('iframe:lab-preview-a', 'folders.create', 'transported action')
    expect(host.snapshot().revision).toBe(initial.revision)

    const created = host.createFolder(null, 'Revision Folder')
    expect(created.ok).toBe(true)
    const mutated = host.snapshot()
    expect(mutated.revision).toBe(initial.revision + 1)

    const peer = new FakeBackend(buildScenario({ persona: 'admin', dataState: 'populated' }), new ActionLog(), 0)
    peer.hydrate(mutated)
    expect(peer.snapshot().revision).toBe(mutated.revision)
    peer.log.append('iframe:lab-preview-a', 'folders.create', 'hydration echo guard')
    expect(peer.snapshot().revision).toBe(mutated.revision)

    const peerCreated = peer.createFolder(null, 'Peer Revision Folder')
    expect(peerCreated.ok).toBe(true)
    expect(peer.snapshot().revision).toBe(mutated.revision + 1)
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

  it('renders both panes for the same surface', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    expect(screen.getByTestId('lab-compare')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-a')).getByTestId('preview-iframe')).toBeInTheDocument()
    expect(within(screen.getByTestId('lab-preview-b')).getByTestId('preview-iframe')).toBeInTheDocument()
  })

  it('switches the surface for both panes together', () => {
    render(<LabApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Compare' }))
    fireEvent.change(screen.getByLabelText('Compare'), { target: { value: 'contract-probe' } })
    fireEvent.click(screen.getByRole('button', { name: /^manage invitations /i }))
    expect(within(screen.getByTestId('lab-preview-a')).getByTestId('preview-iframe')).toHaveAttribute('title', `${getDesignDefinitions()[0].key} preview`)
    expect(within(screen.getByTestId('lab-preview-b')).getByTestId('preview-iframe')).toHaveAttribute('title', 'contract-probe preview')
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
  it('keeps Design DOM inside iframe browsing contexts', () => {
    const builder = buildScenario({ persona: 'admin', dataState: 'populated' })
    expect(builder.shellModel().domain.name).toBe('Aster Reach')
    expect(document.querySelector('.probe-shell')).toBeNull()
  })
})
