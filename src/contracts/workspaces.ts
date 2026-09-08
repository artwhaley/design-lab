/**
 * Workspace/controller interfaces supplied to interactive Design surfaces
 * (A04, Guardrail 6). These are the fake network boundary: Designs receive
 * semantic operations (`renameFolder`, `assignRole`, ...) — never fetch URLs,
 * reducer dispatch, or direct fixture mutation. The Lab host implements these
 * over one shared fake backend; production integration supplies real shared
 * workspaces through a thin adapter.
 */
import type {
  DepartmentsManagementRow,
  DocumentTypeTemplateMode,
  DocumentTypeTreeNode,
  FolderManagementNode,
  FolderSummary,
  InvitationRow,
  PendingClaimRequest,
  PendingJoinRequest,
  RecordSummary,
  RoleHolder,
  RoleRecord,
  SupersessionEdge,
  SupersessionNode,
  WorkEntry,
} from './pageModels'
import type { RecordsCapabilities } from './pageModels'

export type { RecordsCapabilities } from './pageModels'

/** Dialog intent state owned by the shared Records workspace. */
export type RecordsDialog = 'create-folder' | 'rename-folder' | 'delete-folder' | null

/** Context-menu intent state owned by the shared Records workspace. */
export type RecordsContextMenu = { kind: 'folder' | 'record'; id: number | null; x: number; y: number } | null

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/**
 * Lab query vocabulary (Bible §19 target; production Records query patch
 * pending — see docs/CONTRACT_BASELINE.md gap 3). Ordering and page/batch size
 * belong to the shared query behavior, never to client slicing.
 */
export type RecordsOrdering = 'newest' | 'oldest' | 'title'

export const RECORDS_ORDERING_LABELS: Record<RecordsOrdering, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title A–Z',
}

export const RECORDS_PAGE_SIZES = [6, 12, 24, 25, 50, 100] as const

export interface RecordsWorkspace {
  search: {
    value: string
    setValue(value: string): void
    active: boolean
    loading: boolean
    subfolders: boolean
    setSubfolders(value: boolean): void
  }
  folders: {
    list: FolderSummary[]
    byId: Map<number, FolderSummary>
    selectedId: number | null
    select(id: number | null): void
    expandedIds: ReadonlySet<number>
    toggleExpanded(id: number): void
    selected: FolderSummary | null
    descendantIds: ReadonlySet<number> | null
  }
  results: {
    records: RecordSummary[]
    trees: SupersessionNode[]
    edges: SupersessionEdge[]
    loadMore(): void
    hasMore: boolean
    loadingMore: boolean
    counts: Map<number, number>
    total: number
    rootCount: number
    loading: boolean
    error: string | null
  }
  selection: {
    recordId: number | null
    selectRecord(id: number | null): void
    selected: RecordSummary | null
    isSuperseded: boolean
  }
  actions: {
    dialog: RecordsDialog
    setDialog(dialog: RecordsDialog): void
    menu: RecordsContextMenu
    setMenu(menu: RecordsContextMenu): void
    returnTo: string
  }
  exposure: {
    typeId: number | null
    apply(typeChoice: string): void
    typeChoice: string
    setTypeChoice(value: string): void
    typeName: string | null
  }
  ordering: {
    value: RecordsOrdering
    setValue(value: RecordsOrdering): void
  }
  pageSize: {
    value: number
    setValue(value: number): void
  }
  /**
   * Folder mutations reachable from the Records surface (Lab addition to the
   * production dialog-state-only snapshot: the Records matrix requires
   * Create/Rename/Delete Folder behavior; see docs/CONTRACT_PRESSURE.md).
   */
  mutations: {
    pending: string | null
    error: string | null
    createFolder(parentId: number | null, name: string): Promise<boolean>
    renameFolder(id: number, name: string): Promise<boolean>
    deleteFolder(id: number): Promise<boolean>
  }
  capabilities: RecordsCapabilities
  reset(): void
}

// ---------------------------------------------------------------------------
// Management workspaces
// ---------------------------------------------------------------------------

/** Common runtime-state flags every fake workspace exposes (T07 overlay). */
export type WorkspaceStateFlags = {
  loading: boolean
  error: string | null
  pending: string | null
}

export interface FoldersManagementWorkspace extends WorkspaceStateFlags {
  nodes: FolderManagementNode[]
  selectedId: number | null
  select(id: number | null): void
  expandedIds: ReadonlySet<number>
  toggleExpanded(id: number): void
  search: string
  setSearch(value: string): void
  sort: 'name' | 'created'
  setSort(value: 'name' | 'created'): void
  canCreateRoot: boolean
  createFolder(parentId: number | null, name: string): Promise<void>
  renameFolder(id: number, name: string): Promise<void>
  /** Resolves false when the move is rejected (impossible descendant cycle). */
  moveFolder(id: number, targetParentId: number | null): Promise<boolean>
  deleteFolder(id: number): Promise<void>
}

export interface RolesManagementWorkspace extends WorkspaceStateFlags {
  roles: RoleRecord[]
  selectedRoleId: number | null
  selectRole(id: number | null): void
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  holdersByRole: Record<string, RoleHolder[]>
  peopleSearch: string
  setPeopleSearch(value: string): void
  searchingPeople: boolean
  searchResults: Array<{ id: number; name: string }>
  assignHolder(roleId: number, characterId: number): Promise<void>
  unassignHolder(roleId: number, characterId: number): Promise<void>
  createRole(input: { name: string; departmentId: number }): Promise<void>
  renameRole(id: number, name: string): Promise<void>
  deleteRole(id: number): Promise<void>
}

export interface DocumentTypesManagementWorkspace extends WorkspaceStateFlags {
  tree: DocumentTypeTreeNode[]
  selectedTypeId: number | null
  select(id: number | null): void
  canManage: boolean
  createType(input: { name: string; parentId: number | null; templateMode: DocumentTypeTemplateMode }): Promise<void>
  duplicateType(id: number): Promise<void>
  archiveType(id: number): Promise<void>
  restoreType(id: number): Promise<void>
  renameType(id: number, name: string): Promise<void>
}

export interface PeopleManagementWorkspace extends WorkspaceStateFlags {
  query: string
  setQuery(value: string): void
  searching: boolean
  results: Array<{ characterId: number; name: string; href: string }>
  canSearch: boolean
  select(characterId: number): void
}

export interface PersonManagementWorkspace extends WorkspaceStateFlags {
  canManageMembers: boolean
  roleFilter: 'held' | 'assignable'
  setRoleFilter(value: 'held' | 'assignable'): void
  assignRole(roleId: number): Promise<void>
  unassignRole(roleId: number): Promise<void>
}

export interface DepartmentsManagementWorkspace extends WorkspaceStateFlags {
  departments: DepartmentsManagementRow[]
  canCreate: boolean
  createDepartment(input: { name: string; description: string }): Promise<void>
  archiveDepartment(id: number): Promise<void>
  restoreDepartment(id: number): Promise<void>
  renameDepartment(id: number, name: string): Promise<void>
}

export interface InvitationsManagementWorkspace extends WorkspaceStateFlags {
  canManage: boolean
  invitations: InvitationRow[]
  pendingJoins: PendingJoinRequest[]
  pendingClaims: PendingClaimRequest[]
  createInvitation(input: { purpose: string; targetLabel: string }): Promise<void>
  resendInvitation(id: number): Promise<void>
  revokeInvitation(id: number): Promise<void>
  approveJoin(id: number): Promise<void>
  denyJoin(id: number): Promise<void>
  approveClaim(id: number): Promise<void>
  denyClaim(id: number): Promise<void>
}

export interface WorkWorkspace extends WorkspaceStateFlags {
  entries: WorkEntry[]
  inspect(entryId: number): void
  approve(entryId: number): Promise<void>
  returnToDraft(entryId: number): Promise<void>
}