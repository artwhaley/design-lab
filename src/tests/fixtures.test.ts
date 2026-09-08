import { describe, expect, it } from 'vitest'

import { buildScenario, STRESS_FOLDER_CHAIN, SUPERSESSION_EDGES } from '../fixtures'
import { MEMBERS } from '../fixtures/members'
import { DEPARTMENTS } from '../fixtures/departments'
import { ROLES } from '../fixtures/roles'
import { FOLDERS } from '../fixtures/folders'
import { DOCUMENT_TYPES } from '../fixtures/documentTypes'
import { LORE_ENTRIES } from '../fixtures/lore'
import { INVITATIONS } from '../fixtures/management'
import { BASE_URL } from '../fixtures/baseDomain'
import type { SurfaceKey } from '../contracts'
import { SURFACE_CATALOG } from '../contracts'

const populated = buildScenario({ persona: 'admin', dataState: 'populated' })
const visitor = buildScenario({ persona: 'visitor', dataState: 'populated' })
const empty = buildScenario({ persona: 'admin', dataState: 'empty' })
const stress = buildScenario({ persona: 'admin', dataState: 'stress' })

describe('fixture scale and stability', () => {
  it('meets the suggested populated counts', () => {
    expect(populated.universe.departments.length).toBeGreaterThanOrEqual(5)
    expect(populated.universe.members.length).toBeGreaterThanOrEqual(24)
    expect(populated.universe.roles.length).toBeGreaterThanOrEqual(8)
    expect(populated.universe.folders.length).toBeGreaterThanOrEqual(24)
    expect(populated.universe.documentTypes.length).toBeGreaterThanOrEqual(8)
    expect(populated.universe.records.length).toBeGreaterThanOrEqual(64)
    expect(populated.universe.lore.length).toBeGreaterThanOrEqual(8)
    expect(populated.universe.invitations.length).toBeGreaterThanOrEqual(4)
  })

  it('IDs are unique across each entity family', () => {
    for (const rows of [
      MEMBERS, DEPARTMENTS, ROLES, FOLDERS, DOCUMENT_TYPES, LORE_ENTRIES, INVITATIONS,
      populated.universe.records, populated.universe.joinRequests, populated.universe.claimRequests,
    ] as Array<Array<{ id: number }>>) {
      const ids = rows.map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('is deterministic: rebuilding produces identical universes', () => {
    const again = buildScenario({ persona: 'admin', dataState: 'populated' })
    expect(again.universe.records).toEqual(populated.universe.records)
    expect(again.universe.folders).toEqual(populated.universe.folders)
  })
})

describe('cross-link resolution', () => {
  it('every member role/department reference resolves', () => {
    for (const member of MEMBERS) {
      for (const deptId of member.departmentIds) {
        expect(DEPARTMENTS.some((d) => d.id === deptId)).toBe(true)
      }
      for (const roleId of member.roleIds) {
        expect(ROLES.some((r) => r.id === roleId)).toBe(true)
      }
    }
  })

  it('every folder parent reference resolves', () => {
    for (const folder of FOLDERS) {
      if (folder.parentId !== null) {
        expect(FOLDERS.some((f) => f.id === folder.parentId)).toBe(true)
      }
    }
  })

  it('every record folder/type/preparedBy reference resolves', () => {
    for (const record of populated.universe.records) {
      if (record.folderId !== null) expect(FOLDERS.some((f) => f.id === record.folderId)).toBe(true)
      if (record.documentTypeId !== null) expect(DOCUMENT_TYPES.some((t) => t.id === record.documentTypeId)).toBe(true)
      expect(MEMBERS.some((m) => m.id === record.preparedByMemberId)).toBe(true)
    }
  })

  it('supersession edges are reciprocal where modeled', () => {
    const newerIds = new Set(SUPERSESSION_EDGES.map((e) => e.newerId))
    const olderIds = new Set(SUPERSESSION_EDGES.map((e) => e.olderId))
    for (const edge of SUPERSESSION_EDGES) {
      expect(newerIds.has(edge.olderId)).toBe(false)
      expect(olderIds.has(edge.newerId)).toBe(false)
      const older = populated.universe.records.find((r) => r.id === edge.olderId)
      const newer = populated.universe.records.find((r) => r.id === edge.newerId)
      expect(older?.lifecycle).toBe('superseded')
      expect(newer?.lifecycle).not.toBe('superseded')
    }
  })

  it('every supplied href resolves to a known Lab route or external class', () => {
    const external = new Set(['/login', '/account', '/work', '/customize'])
    const admin = buildScenario({ persona: 'admin', dataState: 'populated' })
    const hrefs: string[] = []
    hrefs.push(...admin.shellModel().primaryNavigation.map((n) => n.href))
    hrefs.push(...admin.shellModel().managementNavigation.map((n) => n.href))
    hrefs.push(...admin.homeModel().destinations.map((d) => d.href))
    hrefs.push(...admin.recordsModel().records.map((r) => `${BASE_URL}/documents/${r.id}`))
    hrefs.push(...admin.membersModel().rows.map((r) => r.profileHref ?? ''))
    hrefs.push(...admin.loreModel().entries.map((e) => e.href))
    for (const href of hrefs) {
      expect(href.startsWith(BASE_URL) || external.has(href), `unrecognized href ${href}`).toBe(true)
      expect(href).toMatch(/^(\/domain\/aster-reach(\/|$)|\/(login|account|work|customize)$)/)
    }
  })
})

describe('persona projections', () => {
  it('visitor receives no management navigation and no management routes', () => {
    const shell = visitor.shellModel()
    expect(shell.managementNavigation).toEqual([])
    expect(shell.operatingContext.account).toBeNull()
  })

  it('visitor records are filed-only and carry no act/edit capabilities', () => {
    const records = visitor.recordsModel()
    expect(records.records.length).toBeGreaterThan(0)
    for (const record of records.records) {
      expect(record.lifecycle).toBe('filed')
      expect(record.capabilities.edit).toBe(false)
      expect(record.capabilities.supersede).toBe(false)
      expect(record.capabilities.delete).toBe(false)
    }
    expect(records.capabilities.actOnRecords).toBe(false)
  })

  it('visitor document model has no actionable capabilities', () => {
    const recordId = visitor.defaultRecordId()
    expect(recordId).not.toBeNull()
    const model = visitor.documentModel(recordId!)
    expect(model.capabilities.edit).toBe(false)
    expect(model.capabilities.approve).toBe(false)
    expect(model.capabilities.delete).toBe(false)
  })

  it('visitor cannot reach a restricted record', () => {
    expect(() => visitor.documentModel(50)).toThrow(/not visible/)
  })

  it('admin projection contains every management surface', () => {
    const admin = buildScenario({ persona: 'admin', dataState: 'populated' })
    expect(admin.managementDepartmentsModel().canCreate).toBe(true)
    expect(admin.managementFoldersModel().rootManageable).toBe(true)
    expect(admin.managementRolesModel().assignableRoleIds.length).toBeGreaterThan(0)
    expect(admin.managementDocumentTypesModel().canManage).toBe(true)
    expect(admin.managementPeopleModel().canOpenPeople).toBe(true)
    expect(admin.managementInvitationsModel().canManage).toBe(true)
    expect(admin.workModel().domainAdmin).toBe(true)
  })

  it('member work queue is scoped to the acting department', () => {
    const member = buildScenario({ persona: 'member', dataState: 'populated' })
    const work = member.workModel()
    expect(work.authorized).toBe(true)
    expect(work.domainAdmin).toBe(false)
    const approvable = work.entries.filter((e) => e.actions.some((a) => a.key === 'approve' && a.state === 'available'))
    expect(approvable.length).toBeGreaterThan(0)
    for (const entry of approvable) {
      expect(entry.href).toMatch(/\/documents\/\d+/)
    }
  })

  it('manager cannot manage departments or invitations', () => {
    const manager = buildScenario({ persona: 'departmentManager', dataState: 'populated' })
    expect(manager.managementDepartmentsModel().canCreate).toBe(false)
    expect(manager.managementInvitationsModel().canManage).toBe(false)
    expect(manager.managementPeopleModel().canOpenPeople).toBe(false)
  })

  it('empty data state keeps meaningful shell but empties collections', () => {
    expect(empty.shellModel().domain.name).toBe('Aster Reach')
    expect(empty.recordsModel().records).toEqual([])
    expect(empty.recordsModel().totalReadableRecordCount).toBe(0)
    expect(empty.loreModel().entries).toEqual([])
    expect(empty.workModel().entries).toEqual([])
    expect(empty.managementInvitationsModel().invitations).toEqual([])
    expect(empty.departmentsModel().departments.length).toBeGreaterThanOrEqual(2)
  })

  it('stress state contains long names, 4+ level nesting, and 20+ tags', () => {
    expect(stress.universe.domain.name.length).toBeGreaterThan(60)
    expect(STRESS_FOLDER_CHAIN.length).toBeGreaterThanOrEqual(3)
    const tags = stress.universe.records.find((r) => r.id === 17)?.tags ?? []
    expect(tags.length).toBeGreaterThanOrEqual(20)
    const stressRecord = stress.recordsModel().records.find((r) => r.id === 17)
    expect(stressRecord?.title.length).toBeGreaterThan(100)
  })

  it('public member and management person facts for the same Character stay distinct', () => {
    const admin = buildScenario({ persona: 'admin', dataState: 'populated' })
    const profile = admin.memberModel(1)
    const person = admin.managementPersonModel(1)
    expect(profile.character.name).toBe(person.character.name)
    expect(profile.profileContactHref).toBe(`${BASE_URL}/manage/people/1`)
    expect(person.controller).not.toBeNull()
    expect(profile.preparedRecords.length).toBeGreaterThanOrEqual(0)
  })
})

describe('review and subdomains compatibility', () => {
  it('review maps to Work semantics and subdomains to Departments', () => {
    const review = SURFACE_CATALOG.find((s) => s.key === 'compat.review')
    const subdomains = SURFACE_CATALOG.find((s) => s.key === 'compat.subdomains')
    expect(review?.kind).toBe('compatibility')
    expect(subdomains?.kind).toBe('compatibility')
    // No design slot exists for either (matrix §2).
    expect(review?.designSlot).toBeUndefined()
    expect(subdomains?.designSlot).toBeUndefined()
    const surfaceKeys: SurfaceKey[] = SURFACE_CATALOG.map((s) => s.key)
    expect(surfaceKeys).toContain('compat.review')
    expect(surfaceKeys).toContain('compat.subdomains')
  })
})