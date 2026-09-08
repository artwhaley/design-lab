import { describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import { ActionLog, FakeBackend, FoldersManagementWorkspaceImpl } from '../workspaces'

const setup = (persona: 'visitor' | 'member' | 'departmentManager' | 'admin' = 'admin') => {
  const builder = buildScenario({ persona, dataState: 'populated' })
  const log = new ActionLog()
  return { builder, log, backend: new FakeBackend(builder, log, 0) }
}

describe('FakeBackend snapshot hydration', () => {
  it('returns a detached JSON-serializable snapshot', () => {
    const { builder, backend } = setup()
    const snapshot = backend.snapshot()

    expect(() => JSON.stringify(snapshot)).not.toThrow()
    snapshot.universe.domain.name = 'Detached copy'
    snapshot.universe.folders[0]!.name = 'Detached folder'
    expect(builder.universe.domain.name).toBe('Aster Reach')
    expect(builder.universe.folders[0]!.name).toBe('Administration')
  })

  it('hydrates mutated universe facts into another backend and workspace', () => {
    const source = setup()
    expect(source.backend.createFolder(null, 'Shared Folder').ok).toBe(true)
    const snapshot = source.backend.snapshot()

    const target = setup()
    target.backend.hydrate(snapshot)
    const workspace = new FoldersManagementWorkspaceImpl(target.backend, target.builder.managementFoldersModel())
    const names: string[] = []
    const collect = (nodes: typeof workspace.nodes) => nodes.forEach((node) => {
      names.push(node.name)
      collect(node.children)
    })
    collect(workspace.nodes)

    expect(names).toContain('Shared Folder')
    expect(target.backend.snapshot().revision).toBe(snapshot.revision)
  })

  it('keeps source snapshots detached after target hydration and mutation', () => {
    const source = setup()
    expect(source.backend.createFolder(null, 'Source Folder').ok).toBe(true)
    const snapshot = source.backend.snapshot()
    const snapshotBeforeTargetMutation = JSON.stringify(snapshot)

    const target = setup()
    target.backend.hydrate(snapshot)
    const folder = target.builder.universe.folders.find((item) => item.name === 'Source Folder')!
    expect(target.backend.renameFolder(folder.id, 'Target Folder').ok).toBe(true)

    expect(JSON.stringify(snapshot)).toBe(snapshotBeforeTargetMutation)
  })

  it('preserves the target persona projection during hydration', () => {
    const source = setup('admin')
    expect(source.backend.createFolder(null, 'Admin Fact').ok).toBe(true)
    const snapshot = source.backend.snapshot()

    const target = setup('visitor')
    target.backend.hydrate(snapshot)

    expect(target.backend.projection.persona).toBe('visitor')
    expect(target.backend.projection.canManageFolders).toBe(false)
    expect(target.builder.managementFoldersModel().rootManageable).toBe(false)
    expect(target.backend.log.entries).toHaveLength(0)
  })

  it('retains the folder descendant-cycle guard', () => {
    const { backend, builder } = setup()
    const before = builder.universe.folders.find((folder) => folder.id === 7)!.parentId

    const result = backend.moveFolder(7, 8)

    expect(result.ok).toBe(false)
    expect(builder.universe.folders.find((folder) => folder.id === 7)!.parentId).toBe(before)
    expect(backend.log.entries.at(-1)?.level).toBe('error')
  })
})
