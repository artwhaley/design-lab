/**
 * FakeBackend — the host-owned in-memory semantic truth for one scenario
 * (spec §12). It is seeded from a ScenarioBuilder's Universe and re-projects
 * Page Models through the same builder, so a mutation in one workspace is
 * reflected by every related surface and both side-by-side panes.
 *
 * The backend does NOT evaluate real authorization: it enforces the fake
 * capability projection of the selected persona (A07) and rejects operations
 * that contradict it so Designs can render realistic denied states.
 *
 * Designs never receive this object (Guardrail 6) — only semantic workspaces.
 */
import type { Lifecycle } from '../contracts'
import type { ScenarioBuilder } from '../fixtures/buildScenario'
import { buildUniverse } from '../fixtures/universe'

export type LogLevel = 'info' | 'error'

export type LabLogEntry = {
  id: number
  scope: string
  action: string
  detail: string
  level: LogLevel
  at: number
}

export class ActionLog {
  entries: LabLogEntry[] = []
  private listeners = new Set<() => void>()
  private counter = 0

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  append(scope: string, action: string, detail = '', level: LogLevel = 'info'): void {
    this.entries.push({ id: ++this.counter, scope, action, detail, level, at: Date.now() })
    for (const listener of [...this.listeners]) listener()
  }

  clear(): void {
    this.entries = []
    for (const listener of [...this.listeners]) listener()
  }
}

export type MutationResult = {
  ok: boolean
  error?: string
  message?: string
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => { if (ms <= 0) resolve(); else setTimeout(resolve, ms) })

export class FakeBackend {
  readonly builder: ScenarioBuilder
  readonly log: ActionLog

  /** Fake latency applied to workspace operations (default short; 0 = instant). */
  latencyMs: number
  /** When true, the next workspace mutation fails once (consumed on use). */
  failNextMutation = false
  /** When true, the current surface read reports an error. */
  readError = false
  /** When true, interactive workspaces report loading. */
  loadingOverride = false

  constructor(builder: ScenarioBuilder, log = new ActionLog(), latencyMs = 120) {
    this.builder = builder
    this.log = log
    this.latencyMs = latencyMs
  }

  get projection() {
    return this.builder.projection
  }

  async wait(extra = 0): Promise<void> {
    await sleep(this.latencyMs + extra)
  }

  /** Consumes a pending next-mutation failure; returns whether it fired. */
  consumeFail(): boolean {
    if (this.failNextMutation) {
      this.failNextMutation = false
      return true
    }
    return false
  }

  /** Restore the deterministic scenario baseline (new Universe, same spec). */
  reset(): void {
    this.builder.universe = buildUniverse(this.builder.spec.dataState)
    this.readError = false
    this.loadingOverride = false
    this.log.append('backend', 'reset', 'scenario state restored to baseline')
  }

  // -------------------------------------------------------------------------
  // Folder mutations (shared by Records surface + Folders management)
  // -------------------------------------------------------------------------

  private nextFolderId(): number {
    return Math.max(0, ...this.builder.universe.folders.map((f) => f.id)) + 1
  }

  folderIsSystemManaged(id: number): boolean {
    return this.builder.universe.folders.find((f) => f.id === id)?.systemManaged ?? false
  }

  createFolder(parentId: number | null, name: string): MutationResult {
    if (!this.projection.canManageFolders) {
      this.log.append('folders', 'create', 'denied: persona lacks folder management', 'error')
      return { ok: false, error: 'Folder creation is not permitted for this viewer.' }
    }
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      this.log.append('folders', 'create', 'rejected: name too short', 'error')
      return { ok: false, error: 'Folder name must be at least 2 characters.' }
    }
    const id = this.nextFolderId()
    this.builder.universe.folders.push({
      id,
      name: trimmed,
      parentId,
      departmentId: parentId !== null ? (this.builder.universe.folders.find((f) => f.id === parentId)?.departmentId ?? 1) : 1,
      systemManaged: false,
      createdAt: new Date().toISOString(),
    })
    this.log.append('folders', 'create', `created "${trimmed}" (${parentId === null ? 'root' : `under ${parentId}`})`)
    return { ok: true, message: `Folder "${trimmed}" created.` }
  }

  renameFolder(id: number, name: string): MutationResult {
    const folder = this.builder.universe.folders.find((f) => f.id === id)
    if (!folder) return { ok: false, error: 'Folder not found.' }
    if (!this.projection.canManageFolders || folder.systemManaged) {
      this.log.append('folders', 'rename', `denied for folder ${id}`, 'error')
      return { ok: false, error: folder.systemManaged ? 'System-managed folders cannot be renamed.' : 'Folder rename is not permitted for this viewer.' }
    }
    const trimmed = name.trim()
    if (trimmed.length < 2) return { ok: false, error: 'Folder name must be at least 2 characters.' }
    folder.name = trimmed
    this.log.append('folders', 'rename', `folder ${id} → "${trimmed}"`)
    return { ok: true, message: 'Folder renamed.' }
  }

  moveFolder(id: number, targetParentId: number | null): MutationResult {
    const folder = this.builder.universe.folders.find((f) => f.id === id)
    if (!folder) return { ok: false, error: 'Folder not found.' }
    if (!this.projection.canManageFolders || folder.systemManaged) {
      this.log.append('folders', 'move', `denied for folder ${id}`, 'error')
      return { ok: false, error: folder.systemManaged ? 'System-managed folders cannot be moved.' : 'Folder move is not permitted for this viewer.' }
    }
    if (targetParentId === id) {
      this.log.append('folders', 'move', `rejected: folder ${id} cannot be its own parent`, 'error')
      return { ok: false, error: 'A folder cannot be moved into itself.' }
    }
    // Impossible descendant cycle: targetParent must not be inside the moved subtree.
    const descendants = new Set<number>()
    const collect = (parentId: number): void => {
      for (const child of this.builder.universe.folders.filter((f) => f.parentId === parentId)) {
        descendants.add(child.id)
        collect(child.id)
      }
    }
    collect(id)
    if (targetParentId !== null && descendants.has(targetParentId)) {
      this.log.append('folders', 'move', `rejected: ${targetParentId} is inside folder ${id}`, 'error')
      return { ok: false, error: 'A folder cannot be moved into its own descendant.' }
    }
    folder.parentId = targetParentId
    this.log.append('folders', 'move', `folder ${id} → parent ${targetParentId ?? 'root'}`)
    return { ok: true, message: 'Folder moved.' }
  }

  deleteFolder(id: number): MutationResult {
    const folder = this.builder.universe.folders.find((f) => f.id === id)
    if (!folder) return { ok: false, error: 'Folder not found.' }
    if (!this.projection.canManageFolders || folder.systemManaged) {
      this.log.append('folders', 'delete', `denied for folder ${id}`, 'error')
      return { ok: false, error: folder.systemManaged ? 'System-managed folders cannot be deleted.' : 'Folder deletion is not permitted for this viewer.' }
    }
    const hasChildren = this.builder.universe.folders.some((f) => f.parentId === id)
    const hasRecords = this.builder.universe.records.some((r) => r.folderId === id)
    if (hasChildren || hasRecords) {
      this.log.append('folders', 'delete', `rejected: folder ${id} is not empty`, 'error')
      return { ok: false, error: 'Only empty folders can be deleted. Move or remove its contents first.' }
    }
    this.builder.universe.folders = this.builder.universe.folders.filter((f) => f.id !== id)
    this.log.append('folders', 'delete', `deleted folder ${id}`)
    return { ok: true, message: 'Folder deleted.' }
  }

  // -------------------------------------------------------------------------
  // Record mutations (Document bridge + Records actions)
  // -------------------------------------------------------------------------

  private findRecord(id: number) {
    return this.builder.universe.records.find((r) => r.id === id)
  }

  setLocked(id: number, locked: boolean): MutationResult {
    const record = this.findRecord(id)
    if (!record) return { ok: false, error: 'Record not found.' }
    record.locked = locked
    this.log.append('document', locked ? 'lock' : 'unlock', `record ${id}`)
    return { ok: true, message: locked ? 'Record locked.' : 'Record unlocked.' }
  }

  setLifecycle(id: number, lifecycle: Lifecycle, actionKey: string): MutationResult {
    const record = this.findRecord(id)
    if (!record) return { ok: false, error: 'Record not found.' }
    record.lifecycle = lifecycle
    this.log.append('document', actionKey, `record ${id} → ${lifecycle}`)
    return { ok: true, message: `Record is now ${lifecycle}.` }
  }

  deleteRecord(id: number): MutationResult {
    const record = this.findRecord(id)
    if (!record) return { ok: false, error: 'Record not found.' }
    this.builder.universe.records = this.builder.universe.records.filter((r) => r.id !== id)
    this.builder.universe.supersessionEdges = this.builder.universe.supersessionEdges.filter((e) => e.newerId !== id && e.olderId !== id)
    this.log.append('document', 'delete', `record ${id} deleted`)
    return { ok: true, message: 'Record deleted.' }
  }
}