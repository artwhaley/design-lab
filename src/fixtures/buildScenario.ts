/**
 * buildScenario — projects the deterministic Universe into authorization-safe
 * Page Models for one persona + data state (A02/A07). Public/member/admin
 * models are DISTINCT projections: hidden facts are never present in a
 * Visitor model merely to be hidden with CSS (Guardrail 5).
 */
import type {
  AboutPageModel,
  DepartmentPageModel,
  DepartmentsManagementPageModel,
  DepartmentsPageModel,
  DocumentPageModel,
  DocumentTypesManagementPageModel,
  DomainShellModel,
  FolderManagementPageModel,
  FolderManagementNode,
  FolderSummary,
  FolderTreeNode,
  HomePageModel,
  InvitationsManagementPageModel,
  Lifecycle,
  LorePageModel,
  MemberPageModel,
  MembersPageModel,
  PeopleManagementPageModel,
  PersonManagementPageModel,
  RecordsPageModel,
  RoleManagementPageModel,
  WorkEntry,
  WorkPageModel,
} from '../contracts'
import { buildUniverse, type Universe } from './universe'
import type { RecordEntity } from './records'
import { managementNavigation, primaryNavigation } from './baseDomain'
import { DEPARTMENT_VOCABULARY } from './departments'
import { roleById } from './roles'
import { OBSIDIAN_ABOUT_BODY_HTML, OBSIDIAN_DOCUMENT_BODY_HTML, OBSIDIAN_DOCUMENT_BODY_SOURCE, OBSIDIAN_HOME_WELCOME_HTML } from './obsidianFidelity'
import type { PersonaKey, ScenarioSpec } from './scenarios'

export type PersonaProjection = {
  persona: PersonaKey
  /** Acting Character id (null for Visitor). */
  actingCharacterId: number | null
  accountName: string | null
  accountEmail: string | null
  /** Departments the persona may administrate (empty = none). */
  administratedDepartmentIds: number[]
  canManageFolders: boolean
  canActOnRecords: boolean
  canDeleteRecords: boolean
  canManageDepartments: boolean
  canManageRoles: boolean
  canManageDocumentTypes: boolean
  canOpenPeople: boolean
  canManageInvitations: boolean
  canManageHome: boolean
  canApproveWork: boolean
  workScopeDepartmentIds: number[] | 'all'
  /** Folders whose records are hidden from this persona entirely. */
  restrictedFolderIds: number[]
}

const PROJECTIONS: Record<PersonaKey, PersonaProjection> = {
  visitor: {
    persona: 'visitor',
    actingCharacterId: null,
    accountName: null,
    accountEmail: null,
    administratedDepartmentIds: [],
    canManageFolders: false,
    canActOnRecords: false,
    canDeleteRecords: false,
    canManageDepartments: false,
    canManageRoles: false,
    canManageDocumentTypes: false,
    canOpenPeople: false,
    canManageInvitations: false,
    canManageHome: false,
    canApproveWork: false,
    workScopeDepartmentIds: [],
    restrictedFolderIds: [22],
  },
  member: {
    persona: 'member',
    actingCharacterId: 7, // Curator Esmé Laurent (Heritage & Records)
    accountName: 'Esmé Laurent',
    accountEmail: 'esmela@example.test',
    administratedDepartmentIds: [],
    canManageFolders: false,
    canActOnRecords: true,
    canDeleteRecords: false,
    canManageDepartments: false,
    canManageRoles: false,
    canManageDocumentTypes: false,
    canOpenPeople: false,
    canManageInvitations: false,
    canManageHome: false,
    canApproveWork: true,
    workScopeDepartmentIds: [6],
    restrictedFolderIds: [22],
  },
  departmentManager: {
    persona: 'departmentManager',
    actingCharacterId: 3, // Sergeant Tomas Ribeiro (Expedition Corps)
    accountName: 'Tomas Ribeiro',
    accountEmail: 'tomasr@example.test',
    administratedDepartmentIds: [2, 4],
    canManageFolders: true,
    canActOnRecords: true,
    canDeleteRecords: false,
    canManageDepartments: false,
    canManageRoles: true,
    canManageDocumentTypes: false,
    canOpenPeople: false,
    canManageInvitations: false,
    canManageHome: false,
    canApproveWork: true,
    workScopeDepartmentIds: [2, 4],
    restrictedFolderIds: [],
  },
  admin: {
    persona: 'admin',
    actingCharacterId: 1, // Captain Ilyas Vance
    accountName: 'Ilyas Vance',
    accountEmail: 'artwhaley@example.test',
    administratedDepartmentIds: [1, 2, 3, 4, 5, 6, 7],
    canManageFolders: true,
    canActOnRecords: true,
    canDeleteRecords: true,
    canManageDepartments: true,
    canManageRoles: true,
    canManageDocumentTypes: true,
    canOpenPeople: true,
    canManageInvitations: true,
    canManageHome: true,
    canApproveWork: true,
    workScopeDepartmentIds: 'all',
    restrictedFolderIds: [],
  },
}

const editAllowedLifecycles: readonly Lifecycle[] = ['draft', 'filed']
const supersedeAllowedLifecycles: readonly Lifecycle[] = ['filed']

function recordVisible(projection: PersonaProjection, universe: Universe, record: RecordEntity): boolean {
  if (record.folderId !== null && projection.restrictedFolderIds.includes(record.folderId)) return false
  if (projection.persona === 'visitor') return record.lifecycle === 'filed'
  if (projection.persona === 'member' || projection.persona === 'departmentManager') {
    const scoped = projection.persona === 'departmentManager'
      ? projection.administratedDepartmentIds.includes(record.departmentId)
      : projection.actingCharacterId !== null && universe.members.find((m) => m.id === projection.actingCharacterId)?.departmentIds.includes(record.departmentId)
    if (scoped) return true
    return record.lifecycle === 'filed'
  }
  return true
}

type RecordCaps = { read: boolean; edit: boolean; supersede: boolean; delete: boolean }

function recordCapabilities(projection: PersonaProjection, record: RecordEntity): RecordCaps {
  return {
    read: true,
    edit: projection.canActOnRecords && editAllowedLifecycles.includes(record.lifecycle) && !record.locked,
    supersede: projection.canActOnRecords && supersedeAllowedLifecycles.includes(record.lifecycle),
    delete: projection.canDeleteRecords,
  }
}

export function folderTree(universe: Universe, visibleRecordIds: Set<number>, includeDescendantCounts = false): FolderSummary[] {
  const byParent = new Map<number | null, FolderSummary[]>()
  const counts = new Map<number, number>()
  for (const record of universe.records) {
    if (record.folderId !== null && visibleRecordIds.has(record.id)) {
      counts.set(record.folderId, (counts.get(record.folderId) ?? 0) + 1)
    }
  }
  for (const folder of universe.folders) {
    const node: FolderSummary = {
      id: folder.id,
      name: folder.name,
      systemManaged: folder.systemManaged,
      readableRecordCount: counts.get(folder.id) ?? 0,
      children: [],
    }
    const siblings = byParent.get(folder.parentId) ?? []
    siblings.push(node)
    byParent.set(folder.parentId, siblings)
  }
  const assemble = (parentId: number | null): FolderSummary[] => {
    return (byParent.get(parentId) ?? []).map((node) => {
      const children = assemble(node.id)
      node.children = children
      const descendantCount = children.reduce((sum, child) => sum + child.readableRecordCount, 0)
      if (includeDescendantCounts) node.readableRecordCount += descendantCount
      else if (node.readableRecordCount === 0) node.readableRecordCount = descendantCount
      return node
    })
  }
  return assemble(null)
}

function folderNodeTree(universe: Universe): FolderTreeNode[] {
  const byParent = new Map<number | null, FolderTreeNode[]>()
  for (const folder of universe.folders) {
    const node: FolderTreeNode = {
      id: folder.id,
      name: folder.name,
      systemManaged: folder.systemManaged,
      children: [],
    }
    const siblings = byParent.get(folder.parentId) ?? []
    siblings.push(node)
    byParent.set(folder.parentId, siblings)
  }
  const assemble = (parentId: number | null): FolderTreeNode[] => {
    return (byParent.get(parentId) ?? []).map((node) => ({ ...node, children: assemble(node.id) }))
  }
  return assemble(null)
}

function workEntries(universe: Universe, projection: PersonaProjection, baseUrl: string): WorkEntry[] {
  const entries: WorkEntry[] = []
  const scope = projection.workScopeDepartmentIds
  for (const record of universe.records) {
    if (record.lifecycle !== 'submitted') continue
    const inScope = scope === 'all' || scope.includes(record.departmentId)
    const approvable = projection.canApproveWork && inScope
    entries.push({
      id: record.id,
      kind: 'document',
      title: record.title,
      summary: 'Submitted',
      href: `${baseUrl}/documents/${record.id}`,
      requestedAtLabel: formatDate(record.updatedAt),
      folderName: folderNameOf(universe, record.folderId) ?? undefined,
      actions: [
        { key: 'inspect', label: 'Inspect', kind: 'default', state: 'available' },
        { key: 'approve', label: 'Approve', kind: 'primary', state: approvable ? 'available' : 'absent' },
        { key: 'return', label: 'Return to draft', kind: 'default', state: approvable ? 'available' : 'absent' },
      ],
    })
  }
  if (projection.canManageInvitations) {
    for (const join of universe.joinRequests) {
      entries.push({
        id: 1000 + join.id,
        kind: 'join',
        title: `Domain join · ${join.applicantLabel}`,
        summary: join.characterLabel,
        href: `${baseUrl}/manage/invitations`,
        requestedAtLabel: formatDate(join.requestedAt),
        actions: [
          { key: 'inspect', label: 'Inspect', kind: 'default', state: 'available' },
          { key: 'approve', label: 'Approve', kind: 'primary', state: 'available' },
          { key: 'deny', label: 'Deny', kind: 'destructive', state: 'available' },
        ],
      })
    }
    for (const claim of universe.claimRequests) {
      entries.push({
        id: 2000 + claim.id,
        kind: 'claim',
        title: `Character claim · ${claim.characterLabel}`,
        summary: `Requested by ${claim.claimantLabel}`,
        href: `${baseUrl}/manage/invitations`,
        requestedAtLabel: formatDate(claim.requestedAt),
        actions: [
          { key: 'inspect', label: 'Inspect', kind: 'default', state: 'available' },
          { key: 'approve', label: 'Approve', kind: 'primary', state: 'available' },
          { key: 'deny', label: 'Deny', kind: 'destructive', state: 'available' },
        ],
      })
    }
  }
  entries.sort((left, right) => right.requestedAtLabel.localeCompare(left.requestedAtLabel))
  return entries
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function folderNameOf(universe: Universe, folderId: number | null): string | null {
  if (folderId === null) return null
  return universe.folders.find((f) => f.id === folderId)?.name ?? null
}

function memberName(universe: Universe, memberId: number): string {
  return universe.members.find((m) => m.id === memberId)?.name ?? 'Unknown'
}

function departmentNamesOf(universe: Universe, memberId: number): string[] {
  const member = universe.members.find((m) => m.id === memberId)
  if (!member) return []
  return member.departmentIds.map((id) => universe.departments.find((department) => department.id === id)?.name ?? `Department ${id}`)
}

function roleLabelsOf(universe: Universe, memberId: number): string[] {
  const member = universe.members.find((m) => m.id === memberId)
  if (!member) return []
  return member.roleIds.map((id) => universe.roles.find((role) => role.id === id)?.name ?? `Role ${id}`)
}

export class ScenarioBuilder {
  readonly spec: ScenarioSpec
  universe: Universe
  readonly projection: PersonaProjection
  readonly baseUrl: string

  constructor(spec: ScenarioSpec) {
    this.spec = spec
    this.universe = buildUniverse(spec.dataState, spec.fixtureProfile)
    this.projection = spec.fixtureProfile === 'obsidian-fidelity'
      ? { ...PROJECTIONS[spec.persona], actingCharacterId: spec.persona === 'visitor' ? null : 1, accountName: spec.persona === 'visitor' ? null : 'Morgan', accountEmail: spec.persona === 'visitor' ? null : 'morgan@example.test', administratedDepartmentIds: spec.persona === 'admin' ? [1, 2, 3] : PROJECTIONS[spec.persona].administratedDepartmentIds }
      : PROJECTIONS[spec.persona]
    this.baseUrl = this.universe.domain.baseUrl
  }

  /** Records this persona may see, newest first. */
  visibleRecords(): RecordEntity[] {
    const visible = this.universe.records.filter((record) => recordVisible(this.projection, this.universe, record))
    return [...visible].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  visibleRecordIds(): Set<number> {
    return new Set(this.visibleRecords().map((r) => r.id))
  }

  defaultRecordId(): number | null {
    return this.visibleRecords()[0]?.id ?? null
  }

  defaultMemberCharacterId(): number | null {
    const active = this.universe.members.filter((m) => m.status === 'active')
    return active[0]?.id ?? null
  }

  defaultPersonCharacterId(): number | null {
    return this.universe.members[0]?.id ?? null
  }

  // --- Shell ---------------------------------------------------------------

  shellModel(): DomainShellModel {
    const { projection } = this
    const domain = this.universe.domain
    const acting = projection.actingCharacterId !== null ? this.universe.members.find((m) => m.id === projection.actingCharacterId) ?? null : null
    return {
      domain: {
        id: domain.id,
        slug: domain.slug,
        name: domain.name,
        motto: domain.motto,
        logoUrl: domain.logoUrl,
        bannerUrl: domain.bannerUrl,
        backgroundUrl: domain.backgroundUrl,
      },
      primaryNavigation: this.spec.fixtureProfile === 'obsidian-fidelity'
        ? [
            { label: 'Home', segment: '', href: this.baseUrl },
            { label: 'About', segment: 'about', href: `${this.baseUrl}/about` },
            { label: 'Lore', segment: 'lore', href: `${this.baseUrl}/lore` },
            { label: 'Departments', segment: 'departments', href: `${this.baseUrl}/departments` },
            { label: 'Records', segment: 'records', href: `${this.baseUrl}/records` },
          ]
        : primaryNavigation(projection.persona),
      managementNavigation: this.spec.fixtureProfile === 'obsidian-fidelity'
        ? [
            { label: 'People', segment: 'manage/people', href: `${this.baseUrl}/manage/people` },
            { label: 'Members', segment: 'members', href: `${this.baseUrl}/members` },
            { label: 'Roles', segment: 'roles', href: `${this.baseUrl}/roles` },
            { label: 'Folders', segment: 'manage/folders', href: `${this.baseUrl}/manage/folders` },
            { label: 'Departments', segment: 'manage/departments', href: `${this.baseUrl}/manage/departments` },
            { label: 'Document Types', segment: 'document-types', href: `${this.baseUrl}/document-types` },
            { label: 'Invitations', segment: 'manage/invitations', href: `${this.baseUrl}/manage/invitations` },
            { label: 'Customize', segment: 'customize', href: `${this.baseUrl}/customize` },
          ]
        : managementNavigation(projection.persona),
      operatingContext: {
        platformLabel: 'LoreForge',
        availableDomains: this.spec.fixtureProfile === 'obsidian-fidelity'
          ? [{ id: 1, slug: 'aster-reach', name: 'Aster Reach' }]
          : [
              { id: 1, slug: 'aster-reach', name: 'Aster Reach' },
              { id: 2, slug: 'telnus', name: 'Telnus Archive' },
            ],
        activeDomainId: domain.id,
        availableCharacters: acting
          ? this.universe.members.filter((m) => m.status === 'active' && projection.persona !== 'visitor').slice(0, this.spec.fixtureProfile === 'obsidian-fidelity' ? 1 : 4).map((m) => ({ id: m.id, name: m.name }))
          : [],
        activeCharacterId: acting?.id ?? null,
        account: projection.accountName ? { name: projection.accountName, email: projection.accountEmail ?? '' } : null,
      },
      routes: {
        baseUrl: this.baseUrl,
        workUrl: `${this.baseUrl}/work`,
      },
    }
  }

  // --- Home ----------------------------------------------------------------

  homeModel(): HomePageModel {
    const domain = this.universe.domain
    const recent = this.visibleRecords().slice(0, 5).map((record) => ({
      id: record.id,
      title: record.title,
      type: record.documentTypeId !== null ? this.universe.documentTypes.find((type) => type.id === record.documentTypeId)?.name ?? 'Unassigned' : 'Unassigned',
      activity: formatDate(record.updatedAt),
    }))
    return {
      baseUrl: this.baseUrl,
      domain: { name: domain.name, motto: domain.motto },
      welcome: {
        html: this.spec.fixtureProfile === 'obsidian-fidelity' ? OBSIDIAN_HOME_WELCOME_HTML : `<h2>Welcome to ${domain.name}</h2><p>${domain.description}</p><p>${domain.descriptionLong}</p>`,
        editHref: this.projection.canManageHome ? `${this.baseUrl}/pages/home/edit` : null,
      },
      destinations: this.shellModel().primaryNavigation.filter((item) => item.label !== 'Home'),
      recentRecords: recent,
    }
  }

  // --- Records -------------------------------------------------------------

  recordsModel(): RecordsPageModel {
    const visible = this.visibleRecords()
    const visibleIds = new Set(visible.map((r) => r.id))
    const { projection } = this
    const typeIds = new Set(visible.map((r) => r.documentTypeId).filter((id): id is number => id !== null))
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      folders: folderTree(this.universe, visibleIds, this.spec.fixtureProfile === 'obsidian-fidelity'),
      totalReadableRecordCount: visible.length,
      records: visible.map((record) => ({
        id: record.id,
        title: record.title,
        folderId: record.folderId,
        documentTypeId: record.documentTypeId,
        updatedAt: record.updatedAt,
        preparedBy: memberName(this.universe, record.preparedByMemberId),
        lifecycle: record.lifecycle,
        locked: record.locked,
        capabilities: recordCapabilities(projection, record),
      })),
      documentTypes: this.universe.documentTypes.filter((t) => typeIds.has(t.id)).map((t) => ({ id: t.id, name: t.name })),
      supersessionEdges: this.universe.supersessionEdges.filter((edge) => visibleIds.has(edge.newerId) && visibleIds.has(edge.olderId)),
      query: { folderId: null, search: '' },
      capabilities: {
        manageFolders: projection.canManageFolders,
        actOnRecords: projection.canActOnRecords,
        deleteRecords: projection.canDeleteRecords,
      },
      vocabulary: { documentSingular: 'Document', documentPlural: 'Documents', folderPlural: 'Folders' },
    }
  }

  // --- Document ------------------------------------------------------------

  documentModel(recordId: number): DocumentPageModel {
    const record = this.universe.records.find((r) => r.id === recordId)
    if (!record || !recordVisible(this.projection, this.universe, record)) {
      throw new Error(`Record ${recordId} is not visible to persona ${this.projection.persona}`)
    }
    const { projection, universe } = this
    const caps = recordCapabilities(projection, record)
    const edges = universe.supersessionEdges
    const supersededByEdge = edges.find((e) => e.olderId === record.id)
    const supersedesEdge = edges.find((e) => e.newerId === record.id)
    const supersededBy = supersededByEdge ? universe.records.find((r) => r.id === supersededByEdge.newerId) ?? null : null
    const supersedes = supersedesEdge ? universe.records.find((r) => r.id === supersedesEdge.olderId) ?? null : null
    return {
      baseUrl: this.baseUrl,
      domainSlug: universe.domain.slug,
      recordId: record.id,
      title: record.title,
      bodyHtml: this.spec.fixtureProfile === 'obsidian-fidelity' && record.id === 1 ? OBSIDIAN_DOCUMENT_BODY_HTML : record.body,
      bodySource: this.spec.fixtureProfile === 'obsidian-fidelity' && record.id === 1 ? OBSIDIAN_DOCUMENT_BODY_SOURCE : record.documentTypeId === 9 ? record.body : null,
      meta: this.spec.fixtureProfile === 'obsidian-fidelity' && record.id === 1
        ? [
            { label: 'Document type', value: 'Accord' },
            { label: 'Collection', value: 'Foundations' },
            { label: 'Filed', value: 'September 7, 2026' },
            { label: 'Prepared by', value: 'Elara Voss' },
          ]
        : [
            { label: 'Document type', value: record.documentTypeId !== null ? universe.documentTypes.find((type) => type.id === record.documentTypeId)?.name ?? 'Unassigned' : 'Unassigned' },
            { label: 'Folder', value: folderNameOf(universe, record.folderId) ?? '—' },
            { label: 'Updated', value: formatDate(record.updatedAt) },
            { label: 'Department', value: universe.departments.find((department) => department.id === record.departmentId)?.name ?? 'Unknown department' },
          ],
      lifecycle: record.lifecycle,
      locked: record.locked,
      isSuperseded: supersededBy !== null,
      supersession: {
        supersededBy: supersededBy ? { id: supersededBy.id, title: supersededBy.title, createdLabel: formatDate(supersededBy.updatedAt), preparedByLabel: memberName(universe, supersededBy.preparedByMemberId) } : null,
        supersedes: supersedes ? { id: supersedes.id, title: supersedes.title } : null,
      },
      concerns: this.spec.fixtureProfile === 'obsidian-fidelity' && record.id === 1 ? [{ name: 'The Northwatch Council', relationshipLabel: 'Adopting body' }, { name: 'Outer Islands', relationshipLabel: 'Signatory' }] : record.concerns,
      tags: this.spec.fixtureProfile === 'obsidian-fidelity' && record.id === 1 ? ['Foundations', 'Common ground', 'Governance'] : record.tags,
      preparedByLabel: memberName(universe, record.preparedByMemberId),
      capabilities: {
        edit: caps.edit,
        submit: projection.canActOnRecords && record.lifecycle === 'draft' && !record.locked,
        file: projection.canActOnRecords && record.lifecycle === 'submitted',
        approve: projection.canApproveWork && record.lifecycle === 'submitted',
        restore: projection.canActOnRecords && (record.lifecycle === 'deprecated' || record.lifecycle === 'superseded'),
        deprecate: projection.canActOnRecords && record.lifecycle === 'filed',
        lock: projection.canActOnRecords && !record.locked,
        unlock: projection.canActOnRecords && record.locked,
        delete: caps.delete,
        supersede: caps.supersede,
      },
      routes: {
        editUrl: caps.edit ? `${this.baseUrl}/documents/${record.id}/edit` : null,
        historyUrl: `${this.baseUrl}/documents/${record.id}/history`,
        supersedeUrl: caps.supersede ? `${this.baseUrl}/records/new?supersedes=${record.id}` : null,
      },
      statusMessage: record.statusMessage,
    }
  }

  // --- Departments ---------------------------------------------------------

  departmentsModel(): DepartmentsPageModel {
    const departments = this.universe.departments.filter((d) => !d.archived).map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      memberCount: this.spec.fixtureProfile === 'obsidian-fidelity'
        ? [7, 3, 5][this.universe.departments.findIndex((department) => department.id === d.id)] ?? 0
        : this.universe.members.filter((m) => m.status === 'active' && m.departmentIds.includes(d.id)).length,
    }))
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      departments,
      manageHref: this.projection.canManageDepartments ? `${this.baseUrl}/manage/departments` : null,
      vocabulary: { subdomainSingular: DEPARTMENT_VOCABULARY.subdomainSingular, subdomainPlural: DEPARTMENT_VOCABULARY.subdomainPlural },
    }
  }

  departmentModel(departmentSlug: string): DepartmentPageModel {
    const department = this.universe.departments.find((d) => d.slug === departmentSlug)
    if (!department) throw new Error(`Unknown department slug ${departmentSlug}`)
    const members = this.universe.members
      .filter((m) => m.status === 'active' && m.departmentIds.includes(department.id))
      .map((m) => ({ id: m.id, name: m.name, profileHref: `${this.baseUrl}/members/${m.id}` }))
    const folderNames = this.universe.folders.filter((f) => f.departmentId === department.id).map((f) => f.name)
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      name: department.name,
      description: department.description,
      members,
      folderNames,
      manageHref: this.projection.canManageDepartments ? `${this.baseUrl}/manage/departments` : null,
      vocabulary: {
        subdomainSingular: DEPARTMENT_VOCABULARY.subdomainSingular,
        subdomainPlural: DEPARTMENT_VOCABULARY.subdomainPlural,
        folderPlural: DEPARTMENT_VOCABULARY.folderPlural,
        memberPlural: DEPARTMENT_VOCABULARY.memberPlural,
      },
      destinations: [
        { label: 'Records', segment: 'records', href: `${this.baseUrl}/records` },
        { label: 'Members', segment: 'members', href: `${this.baseUrl}/members` },
      ],
    }
  }

  // --- About / Lore --------------------------------------------------------

  aboutModel(): AboutPageModel {
    return {
      baseUrl: this.baseUrl,
      bodyHtml: this.spec.fixtureProfile === 'obsidian-fidelity' ? OBSIDIAN_ABOUT_BODY_HTML : `<h2>About ${this.universe.domain.name}</h2><p>${this.universe.domain.descriptionLong}</p><p>The archive charter is simple: public histories are public, registry records are guarded, and the past is annotated, never edited.</p>`,
      editHref: this.projection.canManageHome ? `${this.baseUrl}/pages/about/edit` : null,
      destinations: [
        { label: 'Departments', segment: 'departments', href: `${this.baseUrl}/departments` },
        { label: 'Lore', segment: 'lore', href: `${this.baseUrl}/lore` },
      ],
    }
  }

  loreModel(): LorePageModel {
    const entries = this.universe.lore.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      group: entry.group,
      summary: entry.summary,
      revisionLabel: entry.revisionLabel,
      href: `${this.baseUrl}/lore/${entry.slug}`,
    }))
    return {
      baseUrl: this.baseUrl,
      entries,
      destinations: this.spec.fixtureProfile === 'obsidian-fidelity'
        ? [
            { label: 'About', segment: 'about', href: `${this.baseUrl}/about` },
            { label: 'Lore', segment: 'lore', href: `${this.baseUrl}/lore` },
            { label: 'Departments', segment: 'departments', href: `${this.baseUrl}/departments` },
            { label: 'Records', segment: 'records', href: `${this.baseUrl}/records` },
          ]
        : [
            { label: 'About', segment: 'about', href: `${this.baseUrl}/about` },
            { label: 'Members', segment: 'members', href: `${this.baseUrl}/members` },
          ],
    }
  }

  // --- Members / Member profile ---------------------------------------------

  membersModel(): MembersPageModel {
    const rows = this.universe.members
      .filter((m) => m.status === 'active')
      .map((m) => ({
        characterId: m.id,
        name: m.name,
        departments: departmentNamesOf(this.universe, m.id),
        roles: roleLabelsOf(this.universe, m.id),
        profileHref: `${this.baseUrl}/members/${m.id}`,
        avatarUrl: m.avatarUrl,
      }))
    return { baseUrl: this.baseUrl, domainSlug: this.universe.domain.slug, domainName: this.universe.domain.name, rows, status: null }
  }

  memberModel(characterId: number): MemberPageModel {
    const member = this.universe.members.find((m) => m.id === characterId)
    if (!member) throw new Error(`Unknown member characterId ${characterId}`)
    const visibleIds = this.visibleRecordIds()
    const prepared = this.universe.records
      .filter((r) => r.preparedByMemberId === member.id && visibleIds.has(r.id))
      .slice(0, 6)
      .map((r) => ({ id: r.id, title: r.title, href: `${this.baseUrl}/documents/${r.id}`, preparedAtLabel: formatDate(r.updatedAt) }))
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      character: {
        id: member.id,
        name: member.name,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
      },
        departments: member.departmentIds.map((id) => {
          const department = this.universe.departments.find((item) => item.id === id)
          return { id, name: department?.name ?? `Department ${id}`, href: `${this.baseUrl}/departments/${department?.slug ?? id}` }
        }),
      roleLabels: roleLabelsOf(this.universe, member.id),
      preparedRecords: prepared,
      profileContactHref: this.projection.persona === 'admin' ? `${this.baseUrl}/manage/people/${member.id}` : null,
      status: null,
    }
  }

  // --- Work ----------------------------------------------------------------

  workModel(): WorkPageModel {
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      authorized: this.projection.persona !== 'visitor',
      domainAdmin: this.projection.canManageInvitations,
      entries: workEntries(this.universe, this.projection, this.baseUrl),
      status: null,
    }
  }

  // --- Management projections -----------------------------------------------

  managementDepartmentsModel(): DepartmentsManagementPageModel {
    const { projection } = this
    const rows = this.universe.departments.map((d) => {
      const inScope = projection.administratedDepartmentIds.includes(d.id)
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        archived: d.archived,
        canArchive: projection.canManageDepartments && inScope && !d.archived,
        canRestore: projection.canManageDepartments && inScope && d.archived,
      }
    })
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      departments: rows,
      canCreate: projection.canManageDepartments,
      status: null,
      vocabulary: { subdomainSingular: DEPARTMENT_VOCABULARY.subdomainSingular, subdomainPlural: DEPARTMENT_VOCABULARY.subdomainPlural, roleSingular: DEPARTMENT_VOCABULARY.roleSingular },
    }
  }

  managementFoldersModel(): FolderManagementPageModel {
    const { projection } = this
    const createdAtById = new Map(this.universe.folders.map((f) => [f.id, f.createdAt]))
    const toNode = (node: FolderTreeNode): FolderManagementNode => ({
      id: node.id,
      name: node.name,
      createdAt: createdAtById.get(node.id) ?? '2024-01-01T00:00:00.000Z',
      systemManaged: node.systemManaged,
      canManage: projection.canManageFolders && !node.systemManaged,
      children: node.children.map(toNode),
    })
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      rootManageable: projection.canManageFolders,
      nodes: folderNodeTree(this.universe).map(toNode),
      status: null,
    }
  }

  managementRolesModel(): RoleManagementPageModel {
    const { universe, projection } = this
    const visibleRoleIds = new Set<number>()
    const departments = universe.departments.map((d) => ({
      id: d.id,
      name: d.name,
      roles: universe.roles.filter((r) => r.departmentId === d.id).map((r) => {
        visibleRoleIds.add(r.id)
        return { id: r.id, name: r.name }
      }),
    }))
    const roleRecords = universe.roles.filter((r) => visibleRoleIds.has(r.id) || projection.canManageRoles).map((r) => ({
      id: r.id,
      name: r.name,
      departmentId: r.departmentId,
      parentRoleId: r.parentRoleId,
    }))
    const holdersByRole: Record<string, { id: number; name: string }[]> = {}
    for (const member of universe.members) {
      for (const roleId of member.roleIds) {
        const key = String(roleId)
        holdersByRole[key] = [...(holdersByRole[key] ?? []), { id: member.id, name: member.name }]
      }
    }
    const folderStatesByRole: Record<string, Record<string, { readState: 'inherit' | 'allow' | 'deny'; writeState: 'inherit' | 'allow' | 'deny' }>> = {}
    const typeStatesByRole: Record<string, Record<string, { create: boolean; edit: boolean }>> = {}
    for (const role of universe.roles) {
      folderStatesByRole[String(role.id)] = {}
      for (const folder of universe.folders) {
        folderStatesByRole[String(role.id)][String(folder.id)] = { readState: role.folderRead, writeState: role.folderWrite }
      }
      typeStatesByRole[String(role.id)] = {}
      for (const type of universe.documentTypes) {
        typeStatesByRole[String(role.id)][String(type.id)] = { create: role.typeCreate, edit: role.typeEdit }
      }
    }
    const manageable = projection.administratedDepartmentIds
    return {
      baseUrl: this.baseUrl,
      domainSlug: universe.domain.slug,
      domainName: universe.domain.name,
      departments,
      roleRecords,
      holdersByRole,
      folderNodes: folderNodeTree(universe),
      folderStatesByRole,
      types: universe.documentTypes.map((t) => ({ id: t.id, name: t.name })),
      typeStatesByRole,
      manageableDepartmentIds: manageable,
      assignableRoleIds: projection.canManageRoles ? universe.roles.map((r) => r.id) : [],
      initialRoleId: null,
      status: null,
    }
  }

  managementDocumentTypesModel(): DocumentTypesManagementPageModel {
    const { universe, projection } = this
    const typeNode = (type: import('./documentTypes').DocumentTypeEntity): import('../contracts').DocumentTypeTreeNode => ({
      kind: 'document-type',
      id: type.id,
      name: type.name,
      templateMode: type.templateMode,
      archived: type.archived,
      children: [],
    })
    const tree: import('../contracts').DocumentTypeTreeNode[] = universe.departments.filter((d) => !d.archived).map((d) => {
      const types = universe.documentTypes.filter((t) => t.departmentRootId === d.id && !t.archived)
      return {
        kind: 'department-root' as const,
        id: d.id,
        name: d.name,
        children: types.map(typeNode),
      }
    })
    const unassigned = universe.documentTypes.filter((t) => t.departmentRootId === null && !t.archived)
    if (unassigned.length > 0) {
      tree.push({ kind: 'unassigned', id: 'unassigned', name: 'Unassigned', children: unassigned.map(typeNode) })
    }
    const archived = universe.documentTypes.filter((t) => t.archived)
    if (archived.length > 0) {
      tree.push({ kind: 'type-folder', id: -1, name: 'Archived types', children: archived.map(typeNode) })
    }
    const stagesByType: Record<number, Record<string, string | null>> = {}
    for (const type of universe.documentTypes) {
      stagesByType[type.id] = {}
      for (const stage of type.lifecycleStages) stagesByType[type.id][stage] = stage === 'Draft' ? 'Primary' : null
    }
    return {
      baseUrl: this.baseUrl,
      domainSlug: universe.domain.slug,
      domainName: universe.domain.name,
      tree,
      inspector: {
        roles: universe.roles.map((r) => ({ id: r.id, name: r.name })),
        folders: folderNodeTree(universe),
        stagesByType,
      },
      canManage: projection.canManageDocumentTypes,
      status: null,
    }
  }

  managementPeopleModel(): PeopleManagementPageModel {
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      canOpenPeople: this.projection.canOpenPeople,
      status: null,
    }
  }

  managementPersonModel(characterId: number): PersonManagementPageModel {
    const member = this.universe.members.find((m) => m.id === characterId)
    if (!member) throw new Error(`Unknown person characterId ${characterId}`)
    const { universe, projection } = this
    const roleDepartments = universe.departments.map((d) => ({
      id: d.id,
      name: d.name,
      roles: universe.roles
        .filter((r) => r.departmentId === d.id)
        .map((r) => {
          const held = member.roleIds.includes(r.id)
          return { id: r.id, name: r.name, held }
        }),
    }))
    const typeAccess = universe.documentTypes.map((t) => {
        const heldRoles = universe.roles.filter(role => member.roleIds.includes(role.id))
      const anyCreate = heldRoles.some((r) => r.typeCreate)
      const anyEdit = heldRoles.some((r) => r.typeEdit)
      const source = heldRoles.length > 0 ? 'Role-derived' : 'None'
      return {
        id: t.id,
        name: t.name,
        read: { allowed: true, source },
        create: { allowed: anyCreate, source },
        edit: { allowed: anyEdit, source },
      }
    })
    return {
      baseUrl: this.baseUrl,
      domainSlug: universe.domain.slug,
      domainName: universe.domain.name,
      character: { id: member.id, name: member.name, kind: member.kind, status: member.status },
      controller: member.controllerName ? { id: member.id, name: member.controllerName, email: member.controllerEmail ?? '' } : null,
      localDisplayName: member.displayName,
      roleDepartments,
      folderNodes: folderNodeTree(universe),
      typeAccess,
      canManageMembers: projection.canOpenPeople && projection.canManageRoles,
      roleFilter: 'held',
      status: null,
    }
  }

  managementInvitationsModel(): InvitationsManagementPageModel {
    return {
      baseUrl: this.baseUrl,
      domainSlug: this.universe.domain.slug,
      domainName: this.universe.domain.name,
      canManage: this.projection.canManageInvitations,
      invitations: this.universe.invitations.map((i) => ({
        id: i.id,
        purpose: i.purpose,
        targetLabel: i.targetLabel,
        issuedByLabel: i.issuedByLabel,
        expiresLabel: i.expiresLabel,
        useLabel: i.useLabel,
        statusLabel: i.statusLabel,
        canRevoke: i.canRevoke && this.projection.canManageInvitations,
      })),
      pendingJoins: this.universe.joinRequests.map((j) => ({ id: j.id, applicantLabel: j.applicantLabel, characterLabel: j.characterLabel, requestedAt: j.requestedAt })),
      pendingClaims: this.universe.claimRequests.map((c) => ({ id: c.id, characterLabel: c.characterLabel, claimantLabel: c.claimantLabel, requestedAt: c.requestedAt })),
      claimTargets: this.universe.claimTargets,
      status: null,
    }
  }
}

/** Build a scenario projector (persona + data state). */
export function buildScenario(spec: ScenarioSpec): ScenarioBuilder {
  return new ScenarioBuilder(spec)
}
