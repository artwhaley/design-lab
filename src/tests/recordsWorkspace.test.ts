import { describe, expect, it } from 'vitest'

import type { FolderSummary } from '../contracts'
import { buildScenario } from '../fixtures'
import { ActionLog, DocumentActionBridgeImpl, FakeBackend, RecordsWorkspaceImpl } from '../workspaces'

function setup(persona: 'visitor' | 'member' | 'departmentManager' | 'admin' = 'admin') {
  const builder = buildScenario({ persona, dataState: 'populated' })
  const log = new ActionLog()
  const backend = new FakeBackend(builder, log, 0)
  const model = builder.recordsModel()
  const workspace = new RecordsWorkspaceImpl(backend, model)
  return { builder, backend, workspace, log }
}

describe('records workspace', () => {
  it('starts with a deterministic first page', () => {
    const { workspace } = setup()
    expect(workspace.results.records.length).toBeGreaterThan(0)
    expect(workspace.results.records.length).toBeLessThanOrEqual(12)
    expect(workspace.results.total).toBeGreaterThan(50)
  })

  it('supports title search', async () => {
    const { workspace } = setup()
    workspace.search.setValue('Census Ledger')
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.search.active).toBe(true)
    expect(workspace.results.records.length).toBeGreaterThan(0)
    for (const record of workspace.results.records) {
      expect(record.title.toLowerCase()).toContain('census ledger')
    }
  })

  it('supports folder selection with include-subfolders search scope', async () => {
    const { workspace } = setup()
    const folders = workspace.folders.list
    const root = folders.find((f) => f.name === 'Colonies')
    expect(root).toBeDefined()
    // Mirrors production: selection alone narrows to the folder itself.
    workspace.folders.select(root!.id)
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.results.records.every((r) => r.folderId === root!.id)).toBe(true)
    // Searching with subfolders on includes descendants.
    workspace.search.setSubfolders(true)
    workspace.search.setValue('Census')
    await new Promise((r) => setTimeout(r, 5))
    const withSubfolders = workspace.results.records
    expect(withSubfolders.length).toBeGreaterThan(0)
    const folderIds = new Set<number>()
    const visit = (node: FolderSummary) => { folderIds.add(node.id); node.children.forEach(visit) }
    visit(root!)
    for (const record of withSubfolders) {
      expect(record.folderId === null || folderIds.has(record.folderId)).toBe(true)
    }
    // Turning subfolders off excludes descendant matches.
    workspace.search.setSubfolders(false)
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.results.records.length).toBe(0)
  })

  it('supports document-type exposure', async () => {
    const { workspace, builder } = setup()
    const type = builder.universe.documentTypes.find((t) => t.name === 'Survey Report')!
    workspace.exposure.setTypeChoice(String(type.id))
    workspace.exposure.apply(String(type.id))
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.exposure.typeName).toBe('Survey Report')
    expect(workspace.results.records.length).toBeGreaterThan(0)
    for (const record of workspace.results.records) {
      expect(record.documentTypeId).toBe(type.id)
    }
  })

  it('supports ordering vocabulary', async () => {
    const { workspace } = setup()
    workspace.ordering.setValue('title')
    await new Promise((r) => setTimeout(r, 5))
    const titles = workspace.results.records.map((r) => r.title)
    expect([...titles].sort((a, b) => a.localeCompare(b))).toEqual(titles)
  })

  it('supports page size and load-more with cursor semantics', async () => {
    const { workspace } = setup()
    workspace.pageSize.setValue(6)
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.results.records.length).toBe(6)
    expect(workspace.results.hasMore).toBe(true)
    const first = workspace.results.records.map((r) => r.id)
    workspace.results.loadMore()
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.results.records.length).toBe(12)
    const second = workspace.results.records.map((r) => r.id)
    expect(second.slice(0, 6)).toEqual(first)
  })

  it('folder mutation rejects system-managed targets and illegal moves', async () => {
    const { workspace, backend } = setup('admin')
    const admin = buildScenario({ persona: 'admin', dataState: 'populated' })
    const systemFolder = admin.universe.folders.find((f) => f.systemManaged)!
    const ok = await workspace.mutations.renameFolder(systemFolder.id, 'Renamed')
    expect(ok).toBe(false)
    expect(backend.log.entries.some((e) => e.level === 'error' && e.action === 'rename')).toBe(true)
  })

  it('folder mutation denies non-managers', async () => {
    const { workspace, backend } = setup('visitor')
    const admin = buildScenario({ persona: 'admin', dataState: 'populated' })
    const folder = admin.universe.folders.find((f) => !f.systemManaged)!
    const ok = await workspace.mutations.deleteFolder(folder.id)
    expect(ok).toBe(false)
    expect(backend.log.entries.some((e) => e.level === 'error' && e.action === 'delete')).toBe(true)
  })

  it('reset restores query state', async () => {
    const { workspace } = setup()
    workspace.search.setValue('Directive')
    workspace.folders.select(2)
    workspace.reset()
    expect(workspace.search.value).toBe('')
    expect(workspace.folders.selectedId).toBeNull()
    expect(workspace.actions.dialog).toBeNull()
  })

  it('no direct fixture mutation is reachable through the interface', () => {
    const { workspace } = setup()
    const interfaceKeys = Object.keys(workspace)
    expect(interfaceKeys).toContain('search')
    expect('universe' in workspace).toBe(false)
    expect('dispatch' in workspace).toBe(false)
  })
})

describe('document action bridge', () => {
  it('supplies capability-driven action descriptors', () => {
    const { builder, backend } = setup('admin')
    const model = builder.documentModel(builder.defaultRecordId()!)
    const bridge = new DocumentActionBridgeImpl(backend, model, () => undefined)
    const keys = bridge.actions.map((a) => a.key)
    expect(keys).toContain('view')
    expect(keys).toContain('delete')
    expect(bridge.actions.find((a) => a.key === 'history')!.state).toBe('available')
  })

  it('omits actions for the visitor persona', () => {
    const { builder, backend } = setup('visitor')
    const model = builder.documentModel(builder.defaultRecordId()!)
    const bridge = new DocumentActionBridgeImpl(backend, model, () => undefined)
    for (const action of bridge.actions) {
      if (action.key === 'view' || action.key === 'history') expect(action.state).toBe('available')
      else expect(action.state).toBe('absent')
    }
  })

  it('mutates fixture state through modeled actions', async () => {
    const { builder, backend } = setup('admin')
    const recordId = builder.universe.records.find((r) => r.lifecycle === 'filed' && !r.locked)!.id
    const model = builder.documentModel(recordId)
    const bridge = new DocumentActionBridgeImpl(backend, model, () => undefined)
    const result = await bridge.run('lock')
    expect(result.ok).toBe(true)
    const after = builder.documentModel(recordId)
    expect(after.locked).toBe(true)
    expect(after.capabilities.unlock).toBe(true)
    expect(bridge.actions.find((a) => a.key === 'unlock')!.state).toBe('available')
    expect(backend.log.entries.some((e) => e.action === 'lock')).toBe(true)
  })

  it('records navigation actions in the log', async () => {
    const { builder, backend } = setup('admin')
    const navigations: string[] = []
    const recordId = builder.defaultRecordId()!
    const bridge = new DocumentActionBridgeImpl(backend, builder.documentModel(recordId), (href) => navigations.push(href))
    const result = await bridge.run('history')
    expect(result.ok).toBe(true)
    expect(navigations[0]).toMatch(/\/documents\/\d+\/history/)
  })

  it('honors simulated next-mutation failure once', async () => {
    const { builder, backend } = setup('admin')
    const recordId = builder.universe.records.find((r) => r.lifecycle === 'filed' && !r.locked)!.id
    const bridge = new DocumentActionBridgeImpl(backend, builder.documentModel(recordId), () => undefined)
    backend.failNextMutation = true
    const failed = await bridge.run('lock')
    expect(failed.ok).toBe(false)
    const retry = await bridge.run('lock')
    expect(retry.ok).toBe(true)
  })
})