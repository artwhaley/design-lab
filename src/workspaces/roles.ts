/**
 * RolesManagementWorkspaceImpl — fake Role-management behavior (T05).
 * Selection, people search, and assignment state are workspace-owned; role
 * CRUD + holder assignment run through the backend with persona gating.
 */
import type { RoleHolder, RoleManagementPageModel, RoleRecord, RolesManagementWorkspace } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

export class RolesManagementWorkspaceImpl extends MutatingWorkspace implements RolesManagementWorkspace {
  readonly backend: FakeBackend

  private selectedRole: number | null = null
  private peopleSearchValue = ''
  private searchingFlag = false
  private searchResultsState: Array<{ id: number; name: string }> = []

  constructor(backend: FakeBackend, model: RoleManagementPageModel) {
    super()
    this.backend = backend
    this.selectedRole = model.initialRoleId
  }

  private model(): RoleManagementPageModel {
    return this.backend.builder.managementRolesModel()
  }

  get roles(): RoleRecord[] {
    return this.model().roleRecords
  }

  get selectedRoleId(): number | null {
    return this.selectedRole !== null && this.roles.some((r) => r.id === this.selectedRole) ? this.selectedRole : null
  }

  selectRole = (id: number | null): void => {
    this.selectedRole = id
    this.emit()
  }

  get canCreate(): boolean {
    return this.model().assignableRoleIds.length > 0
  }

  get canEdit(): boolean {
    return this.selectedRoleId !== null && this.model().assignableRoleIds.includes(this.selectedRoleId)
  }

  get canDelete(): boolean {
    return this.canEdit
  }

  get holdersByRole(): Record<string, RoleHolder[]> {
    return this.model().holdersByRole
  }

  get peopleSearch(): string { return this.peopleSearchValue }
  setPeopleSearch = (value: string): void => {
    this.peopleSearchValue = value
    void this.runPeopleSearch()
  }

  get searchingPeople(): boolean { return this.searchingFlag }

  get searchResults(): Array<{ id: number; name: string }> {
    return this.searchResultsState
  }

  private async runPeopleSearch(): Promise<void> {
    this.searchingFlag = true
    this.emit()
    await this.backend.wait()
    this.searchResultsState = this.backend.searchMembers(this.peopleSearchValue).map(({ id, name }) => ({ id, name }))
    this.searchingFlag = false
    this.emit()
  }

  async assignHolder(roleId: number, characterId: number): Promise<void> {
    this.beginMutation('assignHolder')
    await this.runMutation('roles', 'assign', () => this.backend.assignRole(roleId, characterId))
  }

  async unassignHolder(roleId: number, characterId: number): Promise<void> {
    this.beginMutation('unassignHolder')
    await this.runMutation('roles', 'unassign', () => this.backend.unassignRole(roleId, characterId))
  }

  async createRole(input: { name: string; departmentId: number }): Promise<void> {
    this.beginMutation('createRole')
    const result = await this.runMutation('roles', 'create', () => this.backend.createRole(input))
    if (result.ok && this.model().roleRecords.length > 0) {
      const created = this.model().roleRecords[this.model().roleRecords.length - 1]
      this.selectedRole = created.id
    }
  }

  async renameRole(id: number, name: string): Promise<void> {
    this.beginMutation('renameRole')
    await this.runMutation('roles', 'rename', () => this.backend.renameRole(id, name))
  }

  async deleteRole(id: number): Promise<void> {
    this.beginMutation('deleteRole')
    const result = await this.runMutation('roles', 'delete', () => this.backend.deleteRole(id))
    if (result.ok && this.selectedRole === id) this.selectedRole = null
  }
}