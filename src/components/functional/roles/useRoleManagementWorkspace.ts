import { useMemo, useState } from 'react'
import type { RoleDepartment, RoleTreeNode } from '@/components/people/PersonAccessTrees'
import type { RoleManagementPageModel } from '@/lib/page-models/management/roles'

export type RoleSearchResult = { id: number; name: string; localName: string | null; controllerName: string | null; roles: string[]; departments: string[] }
export type RoleDialog = 'create' | 'delete' | 'assign' | null
export type RoleMenuState = null

function flatten(departments: RoleDepartment[]) {
  return departments.flatMap((department) => {
    const visit = (nodes: RoleTreeNode[]): Array<RoleTreeNode & { department: string }> => nodes.flatMap((node) => [{ ...node, department: department.name }, ...visit(node.children)])
    return visit(department.roles)
  })
}

export function useRoleManagementWorkspace(model: RoleManagementPageModel) {
  const allRoles = useMemo(() => flatten(model.departments), [model.departments])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(model.initialRoleId ?? allRoles[0]?.id ?? null)
  const [dialog, setDialog] = useState<RoleDialog>(null)
  const [query, setQuery] = useState('')
  const selectedRole = allRoles.find((role) => role.id === selectedRoleId) ?? null
  const selectedRecord = model.roleRecords.find((role) => role.id === selectedRoleId) ?? null
  const selectedDepartment = selectedRole ? model.departments.find((department) => flatten([department]).some((role) => role.id === selectedRole.id)) ?? null : null
  return {
    allRoles, selectedRoleId, setSelectedRoleId, selectedRole, selectedRecord, selectedDepartment,
    selectRole: (node: RoleTreeNode) => { setSelectedRoleId(node.id); setDialog(null) },
    menu: null as RoleMenuState, openMenu: () => undefined, closeMenu: () => undefined,
    dialog, openDialog: (next: Exclude<RoleDialog, null>) => setDialog(next), closeDialog: () => setDialog(null),
    query, setQuery, results: [] as RoleSearchResult[], selectedPeople: [] as RoleSearchResult[], togglePerson: () => undefined,
    createRole: async (_name: string, _parentRoleId: number | null, _departmentId: number | null) => undefined,
    deleteRole: async (_roleId: number) => undefined,
    assignRole: async (_roleId: number, _characterIds: number[]) => undefined,
  }
}
