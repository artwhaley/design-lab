/**
 * Lab Page Models — the authorization-safe, presentation-neutral semantic
 * facts a Design receives. Snapshot of the target Design Bible contract,
 * named to match the production management-contract checkpoint recorded in
 * docs/CONTRACT_BASELINE.md.
 *
 * Rules: no CSS concepts, no layout vocabulary, no private rows, no raw
 * Payload documents, no authorization evaluators.
 */
import type { ActionDescriptor } from './actions'

// ---------------------------------------------------------------------------
// Lifecycle + shared summary types
// ---------------------------------------------------------------------------

export type Lifecycle = 'draft' | 'submitted' | 'filed' | 'deprecated' | 'superseded'

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  filed: 'Filed',
  deprecated: 'Deprecated',
  superseded: 'Superseded',
}

/** A semantic destination link. `href` is a fully-resolved canonical URL. */
export type NavigationItem = {
  label: string
  segment: string
  href: string
}

export type HomeRecordSummary = {
  id: number | string
  title: string
  type: string
  activity: string
}

export type RecordSummary = {
  id: number
  title: string
  folderId: number | null
  documentTypeId: number | null
  updatedAt: string
  preparedBy: string | null
  lifecycle: Lifecycle
  locked: boolean
  capabilities: {
    read: boolean
    edit: boolean
    supersede: boolean
    delete: boolean
  }
}

export type FolderSummary = {
  id: number
  name: string
  systemManaged: boolean
  readableRecordCount: number
  children: FolderSummary[]
}

export type DocumentTypeSummary = {
  id: number
  name: string
}

export type SupersessionEdge = {
  newerId: number
  olderId: number
}

export type RecordsCapabilities = {
  manageFolders: boolean
  actOnRecords: boolean
  deleteRecords: boolean
}

export type RecordsVocabulary = {
  documentSingular: string
  documentPlural: string
  folderPlural: string
}

/** Supersession forest over already-authorized rows (mirrors production derivation). */
export type SupersessionNode = {
  record: RecordSummary
  children: SupersessionNode[]
}

// ---------------------------------------------------------------------------
// Domain shell
// ---------------------------------------------------------------------------

export type DomainSwitcherOption = {
  id: number
  slug: string
  name: string
}

export type CharacterSwitcherOption = {
  id: number
  name: string
}

export type AccountSummary = {
  name: string
  email: string
}

export type DomainShellModel = {
  domain: {
    id: number
    slug: string
    name: string
    motto: string
    logoUrl: string | null
    bannerUrl: string | null
    backgroundUrl: string | null
  }

  primaryNavigation: NavigationItem[]
  managementNavigation: NavigationItem[]

  operatingContext: {
    platformLabel: string
    availableDomains: DomainSwitcherOption[]
    activeDomainId: number
    availableCharacters: CharacterSwitcherOption[]
    activeCharacterId: number | null
    account: AccountSummary | null
  }

  routes: {
    baseUrl: string
    workUrl: string
  }
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export type HomePageModel = {
  baseUrl: string

  domain: {
    name: string
    motto: string
  }

  welcome: {
    html: string
    editHref: string | null
  }

  destinations: NavigationItem[]
  recentRecords: HomeRecordSummary[]
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export type RecordsQueryState = {
  folderId: number | null
  search: string
}

export type RecordsPageModel = {
  baseUrl: string
  domainSlug: string

  folders: FolderSummary[]
  totalReadableRecordCount: number

  records: RecordSummary[]
  documentTypes: DocumentTypeSummary[]
  supersessionEdges: SupersessionEdge[]

  query: RecordsQueryState

  capabilities: RecordsCapabilities

  vocabulary: RecordsVocabulary
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export type DocumentPageModel = {
  baseUrl: string
  domainSlug: string
  recordId: number

  title: string
  /** Rendered canonical Markdown body (safe HTML). */
  bodyHtml: string
  /** Raw canonical Markdown, only when the viewer should see source. */
  bodySource: string | null

  meta: Array<{ label: string; value: string }>

  lifecycle: Lifecycle
  locked: boolean
  isSuperseded: boolean

  supersession: {
    supersededBy: { id: number; title: string; createdLabel: string; preparedByLabel: string } | null
    supersedes: { id: number; title: string } | null
  }

  concerns: Array<{ name: string; relationshipLabel?: string }>
  tags: string[]

  preparedByLabel: string

  capabilities: {
    edit: boolean
    submit: boolean
    file: boolean
    approve: boolean
    restore: boolean
    deprecate: boolean
    lock: boolean
    unlock: boolean
    delete: boolean
    supersede: boolean
  }

  routes: {
    editUrl: string | null
    historyUrl: string | null
    supersedeUrl: string | null
  }

  statusMessage: { code: string; text: string } | null
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export type DepartmentSummary = {
  id: number
  name: string
  slug: string
  description: string | null
  memberCount: number
}

export type DepartmentsPageModel = {
  baseUrl: string
  domainSlug: string
  domainName: string
  departments: DepartmentSummary[]
  manageHref: string | null
  vocabulary: {
    subdomainSingular: string
    subdomainPlural: string
  }
}

export type DepartmentMember = {
  id: number
  name: string
  profileHref: string | null
}

export type DepartmentPageModel = {
  baseUrl: string
  domainSlug: string
  name: string
  description: string | null
  members: DepartmentMember[]
  folderNames: string[]
  manageHref: string | null
  vocabulary: {
    subdomainSingular: string
    subdomainPlural: string
    folderPlural: string
    memberPlural: string
  }
  destinations: NavigationItem[]
}

// ---------------------------------------------------------------------------
// About / Lore
// ---------------------------------------------------------------------------

export type AboutPageModel = {
  baseUrl: string
  bodyHtml: string
  editHref: string | null
  destinations: NavigationItem[]
}

export type LoreEntry = {
  id: number
  slug: string
  title: string
  group: string
  summary: string
  revisionLabel: string | null
  href: string
}

/**
 * Visibility-safe Lore index (Bible §24). The Lab snapshot expands the
 * production stub: entries, group labels, concise summaries, and revision
 * labels are supplied — never synthesized by the Design at render time.
 */
export type LorePageModel = {
  baseUrl: string
  entries: LoreEntry[]
  destinations: NavigationItem[]
}

// ---------------------------------------------------------------------------
// Members (public directory) + Domain-local Member profile
// ---------------------------------------------------------------------------

export type MemberRow = {
  characterId: number
  name: string
  departments: string[]
  roles: string[]
  profileHref: string | null
  avatarUrl: string | null
}

export type MembersPageModel = ManagementRouteFacts & {
  rows: MemberRow[]
  status: ManagementStatusDescriptor
}

export type MemberPageModel = ManagementRouteFacts & {
  character: {
    id: number
    name: string
    displayName: string | null
    avatarUrl: string | null
  }
  departments: Array<{ id: number; name: string; href: string }>
  roleLabels: string[]
  preparedRecords: Array<{ id: number; title: string; href: string; preparedAtLabel: string }>
  profileContactHref: string | null
  status: ManagementStatusDescriptor
}

// ---------------------------------------------------------------------------
// Operational / management surface facts
// ---------------------------------------------------------------------------

export type ManagementStatusDescriptor = {
  level: 'info' | 'error'
  message: string
} | null

export type ManagementRouteFacts = {
  baseUrl: string
  domainSlug: string
  domainName: string
}

// --- Work ------------------------------------------------------------------

export type WorkEntry = {
  id: number
  kind: 'document' | 'join' | 'claim'
  title: string
  summary: string
  href: string
  requestedAtLabel: string
  folderName?: string
  actions: ActionDescriptor[]
}

export type WorkPageModel = ManagementRouteFacts & {
  authorized: boolean
  domainAdmin: boolean
  entries: WorkEntry[]
  status: ManagementStatusDescriptor
}

// --- Departments management ------------------------------------------------

export type DepartmentsManagementRow = {
  id: number
  name: string
  slug: string
  archived: boolean
  canArchive: boolean
  canRestore: boolean
}

export type DepartmentsManagementPageModel = ManagementRouteFacts & {
  departments: DepartmentsManagementRow[]
  canCreate: boolean
  status: ManagementStatusDescriptor
  vocabulary: { subdomainSingular: string; subdomainPlural: string; roleSingular: string }
}

// --- Folders management ----------------------------------------------------

export type FolderManagementNode = {
  id: number
  name: string
  createdAt: string
  systemManaged: boolean
  canManage: boolean
  children: FolderManagementNode[]
}

export type FolderManagementPageModel = ManagementRouteFacts & {
  rootManageable: boolean
  nodes: FolderManagementNode[]
  status: ManagementStatusDescriptor
}

// --- Roles management ------------------------------------------------------

export type RoleDepartment = {
  id: number
  name: string
  roles: Array<{ id: number; name: string }>
}

export type RoleRecord = {
  id: number
  name: string
  departmentId: number
  parentRoleId: number | null
}

export type RoleHolder = {
  id: number
  name: string
}

export type PermissionState = 'inherit' | 'allow' | 'deny'

export type RoleFolderState = {
  readState: PermissionState
  writeState: PermissionState
}

export type TypePermissionState = {
  create: boolean
  edit: boolean
}

export type FolderTreeNode = {
  id: number
  name: string
  systemManaged: boolean
  children: FolderTreeNode[]
}

export type RoleManagementPageModel = ManagementRouteFacts & {
  departments: RoleDepartment[]
  roleRecords: RoleRecord[]
  holdersByRole: Record<string, RoleHolder[]>
  folderNodes: FolderTreeNode[]
  folderStatesByRole: Record<string, Record<string, RoleFolderState>>
  types: Array<{ id: number; name: string }>
  typeStatesByRole: Record<string, Record<string, TypePermissionState>>
  manageableDepartmentIds: number[]
  assignableRoleIds: number[]
  initialRoleId: number | null
  status: ManagementStatusDescriptor
}

// --- Document Types management ---------------------------------------------

export type DocumentTypeTemplateMode = 'blank' | 'markdown' | 'form-to-markdown'

export type DocumentTypeTreeNode =
  | { kind: 'department-root'; id: number; name: string; children: DocumentTypeTreeNode[] }
  | { kind: 'type-folder'; id: number; name: string; children: DocumentTypeTreeNode[] }
  | { kind: 'document-type'; id: number; name: string; templateMode: DocumentTypeTemplateMode; archived: boolean; children: [] }
  | { kind: 'unassigned'; id: string; name: string; children: DocumentTypeTreeNode[] }

export type DocumentTypesInspectorModel = {
  roles: Array<{ id: number; name: string }>
  folders: FolderTreeNode[]
  stagesByType: Record<number, Record<string, string | null>>
}

export type DocumentTypesManagementPageModel = ManagementRouteFacts & {
  tree: DocumentTypeTreeNode[]
  inspector: DocumentTypesInspectorModel
  canManage: boolean
  status: ManagementStatusDescriptor
}

// --- People / Person management --------------------------------------------

export type PeopleManagementPageModel = ManagementRouteFacts & {
  canOpenPeople: boolean
  status: ManagementStatusDescriptor
}

export type PersonTypeAccessSummary = {
  id: number
  name: string
  read: { allowed: boolean; source: string }
  create: { allowed: boolean; source: string }
  edit: { allowed: boolean; source: string }
}

export type PersonManagementPageModel = ManagementRouteFacts & {
  character: {
    id: number
    name: string
    kind: string
    status: string
  }
  controller: {
    id: number
    name: string | null
    email: string
  } | null
  localDisplayName: string | null
  roleDepartments: RoleDepartment[]
  folderNodes: FolderTreeNode[]
  typeAccess: PersonTypeAccessSummary[]
  canManageMembers: boolean
  roleFilter: 'held' | 'assignable'
  status: ManagementStatusDescriptor
}

// --- Invitations management ------------------------------------------------

export type InvitationRow = {
  id: number
  purpose: string
  targetLabel: string
  issuedByLabel: string | null
  expiresLabel: string
  useLabel: string
  statusLabel: string
  canRevoke: boolean
}

export type PendingJoinRequest = {
  id: number
  applicantLabel: string
  characterLabel: string
  requestedAt: string
}

export type PendingClaimRequest = {
  id: number
  characterLabel: string
  claimantLabel: string
  requestedAt: string
}

export type InvitationsManagementPageModel = ManagementRouteFacts & {
  canManage: boolean
  invitations: InvitationRow[]
  pendingJoins: PendingJoinRequest[]
  pendingClaims: PendingClaimRequest[]
  claimTargets: Array<{ id: number; name: string }>
  status: ManagementStatusDescriptor
}