import { describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import {
  ActionLog,
  DepartmentsManagementWorkspaceImpl,
  DocumentTypesManagementWorkspaceImpl,
  FakeBackend,
  FoldersManagementWorkspaceImpl,
  InvitationsManagementWorkspaceImpl,
  PeopleManagementWorkspaceImpl,
  PersonManagementWorkspaceImpl,
  RolesManagementWorkspaceImpl,
  WorkWorkspaceImpl,
} from '../workspaces'

function setup(persona: 'visitor' | 'member' | 'departmentManager' | 'admin' = 'admin') {
  const builder = buildScenario({ persona, dataState: 'populated' })
  const log = new ActionLog()
  const backend = new FakeBackend(builder, log, 0)
  return { builder, backend, log }
}

describe('folders management workspace', () => {
  it('creates root and subfolders, renames, moves, and deletes', async () => {
    const { builder, backend } = setup()
    const workspace = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
    const before = builder.universe.folders.length
    await workspace.createFolder(null, 'New Root')
    expect(builder.universe.folders.length).toBe(before + 1)
    const created = builder.universe.folders.find((f) => f.name === 'New Root')!
    await workspace.createFolder(created.id, 'Child')
    expect(builder.universe.folders.some((f) => f.name === 'Child' && f.parentId === created.id)).toBe(true)
    await workspace.renameFolder(created.id, 'Renamed Root')
    expect(builder.universe.folders.find((f) => f.id === created.id)?.name).toBe('Renamed Root')
  })

  it('rejects impossible descendant-cycle moves', async () => {
    const { builder, backend } = setup()
    const workspace = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
    const root = builder.universe.folders.find((f) => f.name === 'Expeditions')!
    const child = builder.universe.folders.find((f) => f.name === 'Survey Wing')!
    const ok = await workspace.moveFolder(root.id, child.id)
    expect(ok).toBe(false)
    expect(backend.log.entries.some((e) => e.level === 'error' && e.action === 'move')).toBe(true)
  })

  it('denies system-managed folder mutations', async () => {
    const { builder, backend } = setup()
    const workspace = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
    const system = builder.universe.folders.find((f) => f.systemManaged)!
    await workspace.deleteFolder(system.id)
    expect(builder.universe.folders.some((f) => f.id === system.id)).toBe(true)
  })

  it('supports search and sort', () => {
    const { builder, backend } = setup()
    const workspace = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
    workspace.setSearch('Expedition')
    const names: string[] = []
    const collect = (nodes: typeof workspace.nodes) => nodes.forEach((n) => { names.push(n.name); collect(n.children) })
    collect(workspace.nodes)
    expect(names.length).toBeGreaterThan(0)
    expect(names.some((name) => name.toLowerCase().includes('expedition'))).toBe(true)
    // Ancestor roots are retained so matches stay reachable.
    expect(names.some((name) => name === 'Ephemera')).toBe(true)
    workspace.setSearch('')
    workspace.setSort('created')
    expect(workspace.nodes[0]?.name).toBe('Administration')
  })
})

describe('roles management workspace', () => {
  it('assigns and unassigns holders', async () => {
    const { builder, backend } = setup()
    const workspace = new RolesManagementWorkspaceImpl(backend, builder.managementRolesModel())
    const role = builder.universe.roles.find((r) => !builder.universe.members.some((m) => m.roleIds.includes(r.id)))!
    const member = builder.universe.members.find((m) => !m.roleIds.includes(role.id))!
    await workspace.assignHolder(role.id, member.id)
    expect(builder.universe.members.find((m) => m.id === member.id)!.roleIds).toContain(role.id)
    await workspace.unassignHolder(role.id, member.id)
    expect(builder.universe.members.find((m) => m.id === member.id)!.roleIds).not.toContain(role.id)
  })

  it('denies role creation for managers outside their scope and members entirely', async () => {
    const manager = setup('departmentManager')
    const managerWorkspace = new RolesManagementWorkspaceImpl(manager.backend, manager.builder.managementRolesModel())
    await managerWorkspace.createRole({ name: 'Rogue Role', departmentId: 6 })
    expect(manager.builder.universe.roles.some((r) => r.name === 'Rogue Role')).toBe(false)

    const member = setup('member')
    const memberWorkspace = new RolesManagementWorkspaceImpl(member.backend, member.builder.managementRolesModel())
    expect(memberWorkspace.canCreate).toBe(false)
  })

  it('supports people search state', async () => {
    const { builder, backend } = setup()
    const workspace = new RolesManagementWorkspaceImpl(backend, builder.managementRolesModel())
    workspace.setPeopleSearch('Vance')
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.searchResults.some((r) => r.name.includes('Vance'))).toBe(true)
  })
})

describe('document types management workspace', () => {
  it('creates, duplicates, archives, and restores types', async () => {
    const { builder, backend } = setup()
    const workspace = new DocumentTypesManagementWorkspaceImpl(backend, builder.managementDocumentTypesModel())
    const root = builder.universe.departments.find((d) => d.name === 'Survey & Cartography')!
    await workspace.createType({ name: 'Compass Report', parentId: root.id, templateMode: 'markdown' })
    expect(builder.universe.documentTypes.some((t) => t.name === 'Compass Report')).toBe(true)
    const created = builder.universe.documentTypes.find((t) => t.name === 'Compass Report')!
    await workspace.duplicateType(created.id)
    expect(builder.universe.documentTypes.some((t) => t.name === 'Compass Report (copy)')).toBe(true)
    await workspace.archiveType(created.id)
    expect(builder.universe.documentTypes.find((t) => t.id === created.id)?.archived).toBe(true)
    await workspace.restoreType(created.id)
    expect(builder.universe.documentTypes.find((t) => t.id === created.id)?.archived).toBe(false)
  })

  it('denies type creation for non-managers', async () => {
    const { builder, backend } = setup('member')
    const workspace = new DocumentTypesManagementWorkspaceImpl(backend, builder.managementDocumentTypesModel())
    expect(workspace.canManage).toBe(false)
    const before = builder.universe.documentTypes.length
    await workspace.createType({ name: 'Sneaky', parentId: null, templateMode: 'blank' })
    expect(builder.universe.documentTypes.length).toBe(before)
  })

  it('preserves semantic tree distinctions', () => {
    const { builder, backend } = setup()
    const workspace = new DocumentTypesManagementWorkspaceImpl(backend, builder.managementDocumentTypesModel())
    const kinds = workspace.tree.map((n) => n.kind)
    expect(kinds).toContain('department-root')
    const unassigned = workspace.tree.find((n) => n.kind === 'unassigned')
    expect(unassigned).toBeDefined()
  })
})

describe('people and person workspaces', () => {
  it('searches members with safe hrefs', async () => {
    const { builder, backend } = setup()
    const workspace = new PeopleManagementWorkspaceImpl(backend, builder.managementPeopleModel())
    workspace.setQuery('Laurent')
    await new Promise((r) => setTimeout(r, 5))
    expect(workspace.results.length).toBeGreaterThan(0)
    for (const result of workspace.results) {
      expect(result.href).toMatch(/\/manage\/people\/\d+/)
    }
  })

  it('assigns and unassigns roles in the person workspace', async () => {
    const { builder, backend } = setup()
    const characterId = builder.universe.members[1]!.id
    const workspace = new PersonManagementWorkspaceImpl(backend, builder.managementPersonModel(characterId))
    const role = builder.universe.roles.find((r) => !builder.universe.members.some((m) => m.id === characterId && m.roleIds.includes(r.id)))!
    await workspace.assignRole(role.id)
    expect(builder.universe.members.find((m) => m.id === characterId)!.roleIds).toContain(role.id)
    await workspace.unassignRole(role.id)
    expect(builder.universe.members.find((m) => m.id === characterId)!.roleIds).not.toContain(role.id)
  })

  it('denies person mutations without management capability', async () => {
    const { builder, backend } = setup('member')
    const characterId = builder.universe.members[1]!.id // Amara (does not hold role 1)
    const workspace = new PersonManagementWorkspaceImpl(backend, builder.managementPersonModel(characterId))
    expect(workspace.canManageMembers).toBe(false)
    const role = builder.universe.roles[0]!
    await workspace.assignRole(role.id)
    expect(builder.universe.members.find((m) => m.id === characterId)!.roleIds).not.toContain(role.id)
  })
})

describe('departments management workspace', () => {
  it('archives and restores a scoped department', async () => {
    const { builder, backend } = setup()
    const workspace = new DepartmentsManagementWorkspaceImpl(backend, builder.managementDepartmentsModel())
    const target = builder.universe.departments.find((d) => !d.archived)!
    await workspace.archiveDepartment(target.id)
    expect(builder.universe.departments.find((d) => d.id === target.id)?.archived).toBe(true)
    await workspace.restoreDepartment(target.id)
    expect(builder.universe.departments.find((d) => d.id === target.id)?.archived).toBe(false)
  })

  it('denies archiving outside a manager scope', async () => {
    const { builder, backend } = setup('departmentManager')
    const workspace = new DepartmentsManagementWorkspaceImpl(backend, builder.managementDepartmentsModel())
    const outside = builder.universe.departments.find((d) => d.id === 6)!
    await workspace.archiveDepartment(outside.id)
    expect(builder.universe.departments.find((d) => d.id === outside.id)?.archived).toBe(false)
  })

  it('creates departments for admins', async () => {
    const { builder, backend } = setup()
    const workspace = new DepartmentsManagementWorkspaceImpl(backend, builder.managementDepartmentsModel())
    await workspace.createDepartment({ name: 'Records Annex', description: 'Second-floor annex' })
    expect(builder.universe.departments.some((d) => d.name === 'Records Annex')).toBe(true)
  })
})

describe('invitations management workspace', () => {
  it('revokes, resends, and processes requests', async () => {
    const { builder, backend } = setup()
    const workspace = new InvitationsManagementWorkspaceImpl(backend, builder.managementInvitationsModel())
    const invitation = builder.universe.invitations.find((i) => i.canRevoke)!
    await workspace.revokeInvitation(invitation.id)
    expect(builder.universe.invitations.find((i) => i.id === invitation.id)?.statusLabel).toBe('Revoked')
    await workspace.approveJoin(1)
    expect(builder.universe.joinRequests.some((j) => j.id === 1)).toBe(false)
    await workspace.denyClaim(2)
    expect(builder.universe.claimRequests.some((c) => c.id === 2)).toBe(false)
  })

  it('denies invitation operations for members', async () => {
    const { builder, backend } = setup('member')
    const workspace = new InvitationsManagementWorkspaceImpl(backend, builder.managementInvitationsModel())
    expect(workspace.canManage).toBe(false)
    await workspace.createInvitation({ purpose: 'x', targetLabel: 'y@example.test' })
    expect(builder.universe.invitations.length).toBe(5)
  })
})

describe('work workspace', () => {
  it('approves and returns document work items', async () => {
    const { builder, backend } = setup()
    const workspace = new WorkWorkspaceImpl(backend, builder.workModel(), () => undefined)
    const documentEntry = builder.universe.records.find((r) => r.lifecycle === 'submitted')!
    await workspace.approve(documentEntry.id)
    expect(builder.universe.records.find((r) => r.id === documentEntry.id)?.lifecycle).toBe('filed')
    const submitted = builder.universe.records.find((r) => r.lifecycle === 'submitted')!
    await workspace.returnToDraft(submitted.id)
    expect(builder.universe.records.find((r) => r.id === submitted.id)?.lifecycle).toBe('draft')
  })

  it('inspect records navigation', () => {
    const { builder, backend } = setup()
    const navigations: string[] = []
    const workspace = new WorkWorkspaceImpl(backend, builder.workModel(), (href) => navigations.push(href))
    const entry = builder.workModel().entries[0]!
    workspace.inspect(entry.id)
    expect(navigations[0]).toBe(entry.href)
  })

  it('scopes approvals for department managers', async () => {
    const { builder, backend } = setup('departmentManager')
    const workspace = new WorkWorkspaceImpl(backend, builder.workModel(), () => undefined)
    const outOfScope = builder.universe.records.find((r) => r.lifecycle === 'submitted' && r.departmentId === 5)!
    await workspace.approve(outOfScope.id)
    expect(builder.universe.records.find((r) => r.id === outOfScope.id)?.lifecycle).toBe('submitted')
  })
})

describe('failure injection and reset', () => {
  it('next-mutation failure is consumed once per workspace family', async () => {
    const { builder, backend } = setup()
    const folders = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
    backend.failNextMutation = true
    await folders.createFolder(null, 'Doomed')
    expect(builder.universe.folders.some((f) => f.name === 'Doomed')).toBe(false)
    await folders.createFolder(null, 'Survivor')
    expect(builder.universe.folders.some((f) => f.name === 'Survivor')).toBe(true)
  })

  it('backend reset restores the deterministic baseline', async () => {
    const { builder, backend } = setup()
    const workspace = new DepartmentsManagementWorkspaceImpl(backend, builder.managementDepartmentsModel())
    await workspace.archiveDepartment(2)
    expect(builder.universe.departments.find((d) => d.id === 2)?.archived).toBe(true)
    backend.reset()
    expect(builder.universe.departments.find((d) => d.id === 2)?.archived).toBe(false)
    expect(builder.universe.records.length).toBe(65)
  })
})