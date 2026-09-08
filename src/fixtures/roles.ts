/** Role source entity. Permission examples stay inside the target contract's neutral vocabulary. */
export type RoleEntity = {
  id: number
  name: string
  departmentId: number
  parentRoleId: number | null
  /** Example folder permission states (semantic examples for the Roles surface). */
  folderRead: 'inherit' | 'allow' | 'deny'
  folderWrite: 'inherit' | 'allow' | 'deny'
  typeCreate: boolean
  typeEdit: boolean
}

export const ROLES: readonly RoleEntity[] = [
  { id: 1, name: 'High Steward', departmentId: 1, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
  { id: 2, name: 'Department Head', departmentId: 1, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
  { id: 3, name: 'Chief Cartographer', departmentId: 2, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
  { id: 4, name: 'Surveyor', departmentId: 2, parentRoleId: 3, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: false },
  { id: 5, name: 'Expedition Leader', departmentId: 4, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: false },
  { id: 6, name: 'Xenologist', departmentId: 5, parentRoleId: null, folderRead: 'allow', folderWrite: 'inherit', typeCreate: true, typeEdit: true },
  { id: 7, name: 'Curator', departmentId: 6, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
  { id: 8, name: 'Archivist', departmentId: 6, parentRoleId: 7, folderRead: 'allow', folderWrite: 'allow', typeCreate: false, typeEdit: false },
  { id: 9, name: 'Records Officer', departmentId: 6, parentRoleId: 7, folderRead: 'allow', folderWrite: 'inherit', typeCreate: false, typeEdit: false },
  { id: 10, name: 'Domain Liaison', departmentId: 1, parentRoleId: null, folderRead: 'inherit', folderWrite: 'deny', typeCreate: false, typeEdit: false },
]

export function roleById(id: number): RoleEntity {
  const found = ROLES.find((r) => r.id === id)
  if (!found) throw new Error(`Unknown role id ${id}`)
  return found
}

export function rolesOf(memberRoleIds: number[]): RoleEntity[] {
  return memberRoleIds.map(roleById)
}

export function roleLabels(memberRoleIds: number[]): string[] {
  return rolesOf(memberRoleIds).map((r) => r.name)
}