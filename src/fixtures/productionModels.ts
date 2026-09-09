import type { CharacterProfilePageModel } from '@/lib/page-models/characterProfile'
import type { DomainShellModel } from '@/lib/page-models/shell'
import type { HomePageModel } from '@/lib/page-models/home'
import type { RecordsPageModel } from '@/lib/page-models/records'
import type { DocumentPageModel } from '@/lib/page-models/document'
import type { AboutPageModel, LorePageModel } from '@/lib/page-models/info'
import type { DepartmentPageModel, DepartmentsPageModel } from '@/lib/page-models/departments'
import type { MembersPageModel } from '@/lib/page-models/members'
import type { DepartmentsManagementPageModel } from '@/lib/page-models/management/departments'
import type { FolderManagementPageModel } from '@/lib/page-models/management/folders'
import type { RoleManagementPageModel } from '@/lib/page-models/management/roles'
import type { DocumentTypesManagementPageModel } from '@/lib/page-models/management/documentTypes'
import type { PeopleManagementPageModel, PersonManagementPageModel } from '@/lib/page-models/management/people'
import type { InvitationsManagementPageModel } from '@/lib/page-models/management/invitations'
import type { WorkPageModel } from '@/lib/page-models/management/work'
import type { FolderTreeNode, RoleDepartment, RoleTreeNode } from '@/components/people/PersonAccessTrees'
import type { TypeTreeData, TypeTreeLeaf, TypeTreeNode, InspectorFolderNode } from '@/lib/documents/typeTree'
import type { ScenarioBuilder } from './buildScenario'

export function productionShellModel(builder: ScenarioBuilder): DomainShellModel {
  return builder.shellModel() as unknown as DomainShellModel
}

export function productionHomeModel(builder: ScenarioBuilder): HomePageModel {
  return builder.homeModel() as unknown as HomePageModel
}

export function productionRecordsModel(builder: ScenarioBuilder): RecordsPageModel {
  return builder.recordsModel() as unknown as RecordsPageModel
}

export function productionDocumentModel(builder: ScenarioBuilder, recordId: number): DocumentPageModel {
  return builder.documentModel(recordId) as unknown as DocumentPageModel
}

export function productionDepartmentsModel(builder: ScenarioBuilder): DepartmentsPageModel {
  return builder.departmentsModel() as unknown as DepartmentsPageModel
}

export function productionDepartmentModel(builder: ScenarioBuilder, slug: string): DepartmentPageModel {
  const source = builder.departmentModel(slug)
  const siblings = builder.departmentsModel().departments
  return {
    baseUrl: source.baseUrl,
    domainSlug: source.domainSlug,
    slug,
    name: source.name,
    description: source.description,
    members: source.members.map((member) => ({ id: member.id, name: member.name, characterId: member.id, role: 'Member' })),
    departments: siblings,
    folderNames: source.folderNames,
    manageHref: source.manageHref,
    vocabulary: source.vocabulary,
    destinations: source.destinations,
  }
}

export function productionAboutModel(builder: ScenarioBuilder): AboutPageModel {
  return builder.aboutModel() as unknown as AboutPageModel
}

export function productionLoreModel(builder: ScenarioBuilder): LorePageModel {
  const source = builder.loreModel()
  return { baseUrl: source.baseUrl, destinations: source.destinations, entries: source.entries.map((entry) => ({ slug: entry.slug, href: entry.href, title: entry.title, bodyHtml: '', group: entry.group, summary: entry.summary, revisionLabel: entry.revisionLabel })) }
}

export function productionMembersModel(builder: ScenarioBuilder): MembersPageModel {
  const source = builder.membersModel()
  return {
    baseUrl: source.baseUrl,
    domainSlug: source.domainSlug,
    domainName: source.domainName,
    domainId: builder.universe.domain.id,
    canSearch: builder.projection.persona === 'admin',
    searchResults: [],
    query: '',
    status: null,
    rows: source.rows.map((row) => ({
      membershipId: row.characterId,
      characterId: row.characterId,
      name: row.name,
      localDisplayName: builder.universe.members.find((member) => member.id === row.characterId)?.displayName ?? null,
      controllingUserName: builder.universe.members.find((member) => member.id === row.characterId)?.controllerName ?? null,
      membershipStatus: 'active',
      departments: row.departments,
      roles: row.roles,
    })),
    vocabulary: { domainSingular: 'Domain', memberPlural: 'Members', subdomainSingular: 'Department', subdomainPlural: 'Departments', rolePlural: 'Roles' },
  }
}

export function productionCharacterProfileModel(builder: ScenarioBuilder, characterId: number): CharacterProfilePageModel {
  const member = builder.universe.members.find((m) => m.id === characterId)
  const name = member?.name ?? 'Unnamed character'
  const department = member ? builder.universe.departments.find((d) => d.id === member.departmentIds[0]) ?? null : null
  const role = member ? builder.universe.roles.find((r) => r.id === member.roleIds[0]) ?? null : null
  return {
    baseUrl: builder.baseUrl,
    domainSlug: builder.universe.domain.slug,
    character: { id: characterId, name, kind: member?.kind ?? 'player', status: member?.status ?? 'active' },
    departmentName: department?.name ?? 'Domain members',
    departmentHref: department ? `${builder.baseUrl}/departments/${department.slug}` : `${builder.baseUrl}/members`,
    departmentDescription: department?.description ?? null,
    roleName: role?.name ?? 'Member',
    focus: 'the shared work of the Domain',
    backHref: `${builder.baseUrl}/members`,
  }
}

export function productionWorkModel(builder: ScenarioBuilder): WorkPageModel {
  const source = builder.workModel()
  return { baseUrl: source.baseUrl, domainSlug: source.domainSlug, domainName: source.domainName, domainId: builder.universe.domain.id, authorized: source.authorized, domainAdmin: source.domainAdmin, status: source.status, entries: source.entries.map((entry) => ({ kind: entry.kind as 'document' | 'join' | 'claim', id: entry.id, title: entry.title, summary: entry.summary, href: entry.href, requestedAt: entry.requestedAtLabel, domainId: builder.universe.domain.id, folderName: entry.folderName })) }
}

export function productionDepartmentsManagementModel(builder: ScenarioBuilder): DepartmentsManagementPageModel {
  const source = builder.managementDepartmentsModel()
  return { ...source, domainId: builder.universe.domain.id }
}

type RawFolder = { id: number; name: string; systemManaged: boolean; children: RawFolder[] }
function folderNode(node: RawFolder): FolderTreeNode {
  return { id: node.id, name: node.name, systemManaged: node.systemManaged, readState: 'inherit', writeState: 'inherit', children: node.children.map((child) => folderNode(child)) }
}

export function productionFoldersManagementModel(builder: ScenarioBuilder): FolderManagementPageModel {
  const source = builder.managementFoldersModel()
  const map = (node: typeof source.nodes[number]): FolderManagementPageModel['nodes'][number] => ({ id: node.id, name: node.name, createdAt: node.createdAt, systemManaged: node.systemManaged, canManage: node.canManage, children: node.children.map(map) })
  return { ...source, domainId: builder.universe.domain.id, nodes: source.nodes.map(map) }
}

function roleTree(node: { id: number; name: string; held?: boolean; children?: Array<{ id: number; name: string; held?: boolean; children?: never[] }> }): RoleTreeNode {
  return { id: node.id, name: node.name, held: Boolean(node.held), assignable: true, children: (node.children ?? []).map((child) => roleTree(child)) }
}

function projectedRoleTree(builder: ScenarioBuilder, departmentId: number, held: number[] = []): RoleTreeNode[] {
  const records = builder.universe.roles.filter(role => role.departmentId === departmentId)
  const build = (parentId: number | null, seen = new Set<number>()): RoleTreeNode[] => records.filter(role => (role.parentRoleId ?? null) === parentId && !seen.has(role.id)).map(role => ({
    id: role.id, name: role.name, held: held.includes(role.id),
    assignable: builder.projection.canManageRoles && builder.projection.administratedDepartmentIds.includes(departmentId),
    children: build(role.id, new Set([...seen, role.id])),
  }))
  return build(null)
}

export function productionRolesManagementModel(builder: ScenarioBuilder): RoleManagementPageModel {
  const source = builder.managementRolesModel()
  const departments: RoleDepartment[] = source.departments.map((department) => ({ id: department.id, name: department.name, roles: projectedRoleTree(builder, department.id) }))
  const folderNodes = source.folderNodes.map((node) => folderNode(node as unknown as RawFolder))
  const typeStatesByRole: RoleManagementPageModel['typeStatesByRole'] = {}
  for (const [roleId, states] of Object.entries(source.typeStatesByRole)) {
    typeStatesByRole[roleId] = Object.fromEntries(Object.entries(states).map(([typeId, state]) => [typeId, { create: state.create ? 'grant' : 'inherit', edit: state.edit ? 'grant' : 'inherit' }]))
  }
  const folderStatesByRole: RoleManagementPageModel['folderStatesByRole'] = Object.fromEntries(Object.entries(source.folderStatesByRole).map(([roleId, states]) => [roleId, Object.fromEntries(Object.entries(states).map(([folderId, state]) => [folderId, { readState: state.readState === 'allow' ? 'grant' : state.readState, writeState: state.writeState === 'allow' ? 'grant' : state.writeState }]))]))
  for (const [key, states] of Object.entries(builder.universe.permissionRules ?? {})) {
    const [principal, roleId, resource, id] = key.split(':')
    if (principal !== 'Role') continue
    if (resource === 'Folder') { folderStatesByRole[roleId] ??= {}; folderStatesByRole[roleId][id] = {readState:states.readState,writeState:states.writeState} }
    else { typeStatesByRole[roleId] ??= {}; typeStatesByRole[roleId][id] = states }
  }
  return { baseUrl: source.baseUrl, domainSlug: source.domainSlug, domainName: source.domainName, domainId: builder.universe.domain.id, departments, roleRecords: source.roleRecords, holdersByRole: source.holdersByRole, folderNodes, folderStatesByRole, types: source.types, typeStatesByRole, manageableDepartmentIds: source.manageableDepartmentIds, assignableRoleIds: source.assignableRoleIds, initialRoleId: source.initialRoleId, status: source.status }
}

function typeLeaf(type: import('./documentTypes').DocumentTypeEntity): TypeTreeLeaf {
  return { id: type.id, name: type.name, description: type.description ?? null, active: !type.archived, departmentId: type.departmentRootId, typeFolderId: type.parentFolderId, templateSelection: type.templateMode === 'form-to-markdown' ? 'form' : type.templateMode, templateId: null, templateName: null, templateKind: null, constructedTemplates: { markdown: null, form: null } }
}

export function productionDocumentTypesManagementModel(builder: ScenarioBuilder): DocumentTypesManagementPageModel {
  const source = builder.managementDocumentTypesModel()
  const leaves = builder.universe.documentTypes.map(typeLeaf)
  const roots: TypeTreeNode[] = builder.universe.departments.filter((department) => !department.archived).map((department) => ({ id: `dept-${department.id}`, kind: 'department', name: department.name, children: leaves.filter((leaf) => leaf.departmentId === department.id).map((leaf) => ({ id: `type-${leaf.id}`, kind: 'type', name: leaf.name, leaf, children: [] })) }))
  const unassigned = leaves.filter((leaf) => leaf.departmentId === null)
  if (unassigned.length > 0) roots.push({ id: 'unassigned', kind: 'unassigned', name: 'Unassigned', children: unassigned.map((leaf) => ({ id: `type-${leaf.id}`, kind: 'type', name: leaf.name, leaf, children: [] })) })
  const tree: TypeTreeData = { roots, hasUnassigned: unassigned.length > 0, departments: builder.universe.departments.map((department) => ({ id: department.id, name: department.name, archived: department.archived })), types: leaves }
  const stagesByType: DocumentTypesManagementPageModel['inspector']['stagesByType'] = {}
  for (const leaf of leaves) {
    stagesByType[leaf.id] = { draft: null, submitted: null, filed: null, deprecated: null }
    for (const stage of builder.universe.documentTypes.find(type => type.id === leaf.id)?.stageConfig ?? []) {
      stagesByType[leaf.id][stage.stage] = { ...stage, folder: stage.folderId, readRoles: stage.readRoleIds, writeRoles: stage.writeRoleIds, editOthersRoles: stage.editOthersRoleIds, manageRoles: stage.manageRoleIds }
    }
  }
  const folders: InspectorFolderNode[] = source.inspector.folders.map((folder) => ({ id: folder.id, name: folder.name, children: folder.children.map((child) => ({ id: child.id, name: child.name, children: [] })) }))
  return { ...source, domainId: builder.universe.domain.id, tree, inspector: { roles: source.inspector.roles.map((role) => ({ id: role.id, name: role.name, active: true })), folders, stagesByType } }
}

export function productionPeopleManagementModel(builder: ScenarioBuilder): PeopleManagementPageModel {
  return { ...builder.managementPeopleModel(), domainId: builder.universe.domain.id }
}

export function productionPersonManagementModel(builder: ScenarioBuilder, characterId: number): PersonManagementPageModel {
  const source = builder.managementPersonModel(characterId)
  const mapFolder = (node: RawFolder): FolderTreeNode => ({...folderNode(node),
    ...builder.universe.permissionRules?.[`Character:${characterId}:Folder:${node.id}`],
    canManageAccess: source.canManageMembers, children: node.children.map(mapFolder) })
  return { ...source, domainId: builder.universe.domain.id, roleDepartments: source.roleDepartments.map((department) => ({ ...department, roles: projectedRoleTree(builder, department.id, builder.universe.members.find(member => member.id === characterId)?.roleIds) })), folderNodes: source.folderNodes.map((node) => mapFolder(node as unknown as RawFolder)) }
}

export function productionInvitationsManagementModel(builder: ScenarioBuilder): InvitationsManagementPageModel {
  return { ...builder.managementInvitationsModel(), domainId: builder.universe.domain.id }
}
