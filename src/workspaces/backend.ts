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
import { buildUniverse, type Universe } from '../fixtures/universe'

export type LogLevel = 'info' | 'error'

export type LabLogEntry = {
  id: number
  scope: string
  action: string
  detail: string
  level: LogLevel
  at: number
}

export type FakeBackendSnapshot = {
  universe: Universe
  revision: number
}

const cloneSerializable = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export class ActionLog {
  entries: LabLogEntry[] = []
  private listeners = new Set<() => void>()
  private counter = 0
  private semanticCounter = 0

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  append(scope: string, action: string, detail = '', level: LogLevel = 'info'): void {
    this.entries.push({ id: ++this.counter, scope, action, detail, level, at: Date.now() })
    if (!scope.startsWith('navigation') && !scope.startsWith('studio') && !scope.startsWith('diagnostics') && !scope.startsWith('backend') && !scope.startsWith('iframe:')) {
      this.semanticCounter += 1
    }
    for (const listener of [...this.listeners]) listener()
  }

  clear(): void {
    this.entries = []
    for (const listener of [...this.listeners]) listener()
  }

  get revision(): number {
    return this.semanticCounter
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

  private snapshotRevision = 0
  private observedLogRevision = 0

  constructor(builder: ScenarioBuilder, log = new ActionLog(), latencyMs = 120) {
    this.builder = builder
    this.log = log
    this.latencyMs = latencyMs
    this.observedLogRevision = log.revision
  }

  get projection() {
    return this.builder.projection
  }

  /** Return detached, JSON-safe semantic state for preview transport. */
  snapshot(): FakeBackendSnapshot {
    const logRevision = this.log.revision
    if (logRevision > this.observedLogRevision) {
      this.snapshotRevision += logRevision - this.observedLogRevision
      this.observedLogRevision = logRevision
    }
    return {
      universe: cloneSerializable(this.builder.universe),
      revision: this.snapshotRevision,
    }
  }

  /** Replace only universe facts; persona projection and action log stay local. */
  hydrate(snapshot: FakeBackendSnapshot): void {
    this.builder.universe = cloneSerializable(snapshot.universe)
    this.snapshotRevision = snapshot.revision
    this.observedLogRevision = this.log.revision
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
    this.builder.universe = buildUniverse(this.builder.spec.dataState, this.builder.spec.fixtureProfile)
    this.readError = false
    this.loadingOverride = false
    this.snapshotRevision = 0
    this.observedLogRevision = this.log.revision
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

  // -------------------------------------------------------------------------
  // Department mutations
  // -------------------------------------------------------------------------

  createDepartment(input: { name: string; description: string }): MutationResult {
    if (!this.projection.canManageDepartments) return this.denied('departments', 'create')
    const id = Math.max(0, ...this.builder.universe.departments.map((d) => d.id)) + 1
    const slug = input.name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `department-${id}`
    this.builder.universe.departments.push({ id, name: input.name.trim(), slug, description: input.description.trim() || null, archived: false })
    this.log.append('departments', 'create', `created "${input.name.trim()}"`)
    return { ok: true, message: 'Department created.' }
  }

  archiveDepartment(id: number): MutationResult {
    const department = this.builder.universe.departments.find((d) => d.id === id)
    if (!department) return { ok: false, error: 'Department not found.' }
    if (!this.projection.canManageDepartments || !this.projection.administratedDepartmentIds.includes(id)) return this.denied('departments', 'archive')
    if (department.archived) return { ok: false, error: 'Department is already archived.' }
    department.archived = true
    this.log.append('departments', 'archive', `archived ${department.name}`)
    return { ok: true, message: 'Department archived.' }
  }

  restoreDepartment(id: number): MutationResult {
    const department = this.builder.universe.departments.find((d) => d.id === id)
    if (!department) return { ok: false, error: 'Department not found.' }
    if (!this.projection.canManageDepartments || !this.projection.administratedDepartmentIds.includes(id)) return this.denied('departments', 'restore')
    if (!department.archived) return { ok: false, error: 'Department is not archived.' }
    department.archived = false
    this.log.append('departments', 'restore', `restored ${department.name}`)
    return { ok: true, message: 'Department restored.' }
  }

  renameDepartment(id: number, name: string): MutationResult {
    const department = this.builder.universe.departments.find((d) => d.id === id)
    if (!department) return { ok: false, error: 'Department not found.' }
    if (!this.projection.canManageDepartments || !this.projection.administratedDepartmentIds.includes(id)) return this.denied('departments', 'rename')
    department.name = name.trim()
    this.log.append('departments', 'rename', `renamed ${id}`)
    return { ok: true, message: 'Department renamed.' }
  }

  // -------------------------------------------------------------------------
  // Role mutations
  // -------------------------------------------------------------------------

  private nextRoleId(): number {
    return Math.max(0, ...this.builder.universe.roles.map((r) => r.id)) + 1
  }

  createRole(input: { name: string; departmentId: number; parentRoleId?: number | null }): MutationResult {
    if (!this.projection.canManageRoles) return this.denied('roles', 'create')
    if (!this.projection.administratedDepartmentIds.includes(input.departmentId)) return this.denied('roles', 'create')
    const id = this.nextRoleId()
    this.builder.universe.roles.push({ id, name: input.name.trim(), departmentId: input.departmentId, parentRoleId: input.parentRoleId ?? null, folderRead: 'inherit', folderWrite: 'inherit', typeCreate: false, typeEdit: false })
    this.log.append('roles', 'create', `created "${input.name.trim()}"`)
    return { ok: true, message: 'Role created.' }
  }

  renameRole(id: number, name: string): MutationResult {
    const role = this.builder.universe.roles.find((r) => r.id === id)
    if (!role) return { ok: false, error: 'Role not found.' }
    if (!this.projection.canManageRoles || !this.projection.administratedDepartmentIds.includes(role.departmentId)) return this.denied('roles', 'rename')
    role.name = name.trim()
    this.log.append('roles', 'rename', `renamed role ${id}`)
    return { ok: true, message: 'Role renamed.' }
  }

  deleteRole(id: number): MutationResult {
    const role = this.builder.universe.roles.find((r) => r.id === id)
    if (!role) return { ok: false, error: 'Role not found.' }
    if (!this.projection.canManageRoles || !this.projection.administratedDepartmentIds.includes(role.departmentId)) return this.denied('roles', 'delete')
    const holders = this.builder.universe.members.filter((m) => m.roleIds.includes(id))
    if (holders.length > 0) {
      this.log.append('roles', 'delete', `rejected: role ${id} still assigned`, 'error')
      return { ok: false, error: 'Remove all holders before deleting this role.' }
    }
    this.builder.universe.roles = this.builder.universe.roles.filter((r) => r.id !== id)
    this.log.append('roles', 'delete', `deleted role ${id}`)
    return { ok: true, message: 'Role deleted.' }
  }

  assignRole(roleId: number, characterId: number): MutationResult {
    const member = this.builder.universe.members.find((m) => m.id === characterId)
    const role = this.builder.universe.roles.find((r) => r.id === roleId)
    if (!member || !role) return { ok: false, error: 'Member or role not found.' }
    if (!this.projection.canManageRoles || !this.projection.administratedDepartmentIds.includes(role.departmentId)) return this.denied('roles', 'assign')
    if (member.roleIds.includes(roleId)) return { ok: false, error: 'Role is already held by this member.' }
    member.roleIds.push(roleId)
    this.log.append('roles', 'assign', `role ${roleId} -> member ${characterId}`)
    return { ok: true, message: `Assigned ${role.name}.` }
  }

  unassignRole(roleId: number, characterId: number): MutationResult {
    const member = this.builder.universe.members.find((m) => m.id === characterId)
    if (!member) return { ok: false, error: 'Member not found.' }
    if (!this.projection.canManageRoles) return this.denied('roles', 'unassign')
    if (!member.roleIds.includes(roleId)) return { ok: false, error: 'Member does not hold this role.' }
    member.roleIds = member.roleIds.filter((r) => r !== roleId)
    this.log.append('roles', 'unassign', `role ${roleId} removed from member ${characterId}`)
    return { ok: true, message: 'Role removed.' }
  }

  // -------------------------------------------------------------------------
  // Document Type mutations
  // -------------------------------------------------------------------------

  createDocumentType(input: { name: string; departmentRootId: number | null; templateMode: 'blank' | 'markdown' | 'form-to-markdown' }): MutationResult {
    if (!this.projection.canManageDocumentTypes) return this.denied('documentTypes', 'create')
    const id = Math.max(0, ...this.builder.universe.documentTypes.map((t) => t.id)) + 1
    this.builder.universe.documentTypes.push({ id, name: input.name.trim(), departmentRootId: input.departmentRootId, parentFolderId: null, templateMode: input.templateMode, archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] })
    this.log.append('documentTypes', 'create', `created "${input.name.trim()}"`)
    return { ok: true, message: 'Document Type created.' }
  }

  duplicateDocumentType(id: number): MutationResult {
    const type = this.builder.universe.documentTypes.find((t) => t.id === id)
    if (!type) return { ok: false, error: 'Document Type not found.' }
    if (!this.projection.canManageDocumentTypes) return this.denied('documentTypes', 'duplicate')
    const newId = Math.max(0, ...this.builder.universe.documentTypes.map((t) => t.id)) + 1
    this.builder.universe.documentTypes.push({ ...type, id: newId, name: `${type.name} (copy)`, archived: false })
    this.log.append('documentTypes', 'duplicate', `duplicated ${id} -> ${newId}`)
    return { ok: true, message: 'Document Type duplicated.' }
  }

  setDocumentTypeArchived(id: number, archived: boolean, action: string): MutationResult {
    const type = this.builder.universe.documentTypes.find((t) => t.id === id)
    if (!type) return { ok: false, error: 'Document Type not found.' }
    if (!this.projection.canManageDocumentTypes) return this.denied('documentTypes', action)
    type.archived = archived
    this.log.append('documentTypes', action, `${type.name} (${id})`)
    return { ok: true, message: archived ? 'Document Type archived.' : 'Document Type restored.' }
  }

  renameDocumentType(id: number, name: string): MutationResult {
    const type = this.builder.universe.documentTypes.find((t) => t.id === id)
    if (!type) return { ok: false, error: 'Document Type not found.' }
    if (!this.projection.canManageDocumentTypes) return this.denied('documentTypes', 'rename')
    type.name = name.trim()
    this.log.append('documentTypes', 'rename', `renamed type ${id}`)
    return { ok: true, message: 'Document Type renamed.' }
  }

  // -------------------------------------------------------------------------
  // Invitation mutations
  // -------------------------------------------------------------------------

  createInvitation(input: { purpose: string; targetLabel: string }): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'create')
    const id = Math.max(0, ...this.builder.universe.invitations.map((i) => i.id)) + 1
    this.builder.universe.invitations.push({ id, purpose: input.purpose.trim(), targetLabel: input.targetLabel.trim(), issuedByLabel: this.projection.accountName, expiresLabel: 'Expires 2026-12-31', useLabel: 'Unused', statusLabel: 'Active', canRevoke: true })
    this.log.append('invitations', 'create', `issued to ${input.targetLabel.trim()}`)
    return { ok: true, message: 'Invitation issued.' }
  }

  revokeInvitation(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'revoke')
    const invitation = this.builder.universe.invitations.find((i) => i.id === id)
    if (!invitation) return { ok: false, error: 'Invitation not found.' }
    if (!invitation.canRevoke) return { ok: false, error: 'This invitation can no longer be revoked.' }
    invitation.statusLabel = 'Revoked'
    invitation.canRevoke = false
    this.log.append('invitations', 'revoke', `invitation ${id}`)
    return { ok: true, message: 'Invitation revoked.' }
  }

  resendInvitation(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'resend')
    const invitation = this.builder.universe.invitations.find((i) => i.id === id)
    if (!invitation) return { ok: false, error: 'Invitation not found.' }
    invitation.expiresLabel = 'Expires 2026-12-31'
    invitation.statusLabel = 'Active'
    this.log.append('invitations', 'resend', `invitation ${id}`)
    return { ok: true, message: 'Invitation resent.' }
  }

  approveJoin(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'approveJoin')
    if (!this.builder.universe.joinRequests.some((j) => j.id === id)) return { ok: false, error: 'Join request not found.' }
    this.builder.universe.joinRequests = this.builder.universe.joinRequests.filter((j) => j.id !== id)
    this.log.append('invitations', 'approveJoin', `request ${id}`)
    return { ok: true, message: 'Join request approved.' }
  }

  denyJoin(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'denyJoin')
    if (!this.builder.universe.joinRequests.some((j) => j.id === id)) return { ok: false, error: 'Join request not found.' }
    this.builder.universe.joinRequests = this.builder.universe.joinRequests.filter((j) => j.id !== id)
    this.log.append('invitations', 'denyJoin', `request ${id}`)
    return { ok: true, message: 'Join request denied.' }
  }

  approveClaim(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'approveClaim')
    if (!this.builder.universe.claimRequests.some((c) => c.id === id)) return { ok: false, error: 'Claim request not found.' }
    this.builder.universe.claimRequests = this.builder.universe.claimRequests.filter((c) => c.id !== id)
    this.log.append('invitations', 'approveClaim', `request ${id}`)
    return { ok: true, message: 'Claim request approved.' }
  }

  denyClaim(id: number): MutationResult {
    if (!this.projection.canManageInvitations) return this.denied('invitations', 'denyClaim')
    if (!this.builder.universe.claimRequests.some((c) => c.id === id)) return { ok: false, error: 'Claim request not found.' }
    this.builder.universe.claimRequests = this.builder.universe.claimRequests.filter((c) => c.id !== id)
    this.log.append('invitations', 'denyClaim', `request ${id}`)
    return { ok: true, message: 'Claim request denied.' }
  }

  // -------------------------------------------------------------------------
  // People search (ephemeral, server-filtered in production)
  // -------------------------------------------------------------------------

  searchMembers(query: string): Array<{ id: number; name: string; href: string }> {
    const baseUrl = this.builder.baseUrl
    const q = query.trim().toLocaleLowerCase()
    return this.builder.universe.members
      .filter((m) => m.status === 'active' && (q === '' || m.name.toLocaleLowerCase().includes(q)))
      .slice(0, 25)
      .map((m) => ({ id: m.id, name: m.name, href: `${baseUrl}/manage/people/${m.id}` }))
  }

  // -------------------------------------------------------------------------
  // Work mutations
  // -------------------------------------------------------------------------

  approveWorkEntry(entryId: number): MutationResult {
    if (entryId >= 2000) {
      const id = entryId - 2000
      return this.approveClaim(id)
    }
    if (entryId >= 1000) {
      const id = entryId - 1000
      return this.approveJoin(id)
    }
    if (!this.projection.canApproveWork) return this.denied('work', 'approve')
    const record = this.findRecord(entryId)
    if (!record) return { ok: false, error: 'Work item not found.' }
    const scope = this.projection.workScopeDepartmentIds
    if (scope !== 'all' && !scope.includes(record.departmentId)) return this.denied('work', 'approve')
    return this.setLifecycle(entryId, 'filed', 'work.approve')
  }

  returnWorkEntry(entryId: number): MutationResult {
    if (!this.projection.canApproveWork) return this.denied('work', 'return')
    const record = this.findRecord(entryId)
    if (!record) return { ok: false, error: 'Work item not found.' }
    const scope = this.projection.workScopeDepartmentIds
    if (scope !== 'all' && !scope.includes(record.departmentId)) return this.denied('work', 'return')
    return this.setLifecycle(entryId, 'draft', 'work.return')
  }

  private denied(scope: string, action: string): MutationResult {
    this.log.append(scope, action, 'denied: persona lacks capability', 'error')
    return { ok: false, error: 'This operation is not permitted for the current viewer.' }
  }
}
