/**
 * People + Person management workspaces (T05). People search state is
 * debounce-shaped and local; results are safe projections. Person mutations
 * go through the backend with capability gating.
 */
import type { PeopleManagementPageModel, PeopleManagementWorkspace, PersonManagementPageModel, PersonManagementWorkspace } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

export class PeopleManagementWorkspaceImpl extends MutatingWorkspace implements PeopleManagementWorkspace {
  readonly backend: FakeBackend

  private queryValue = ''
  private searchingFlag = false
  private resultsState: Array<{ characterId: number; name: string; href: string }> = []
  private onSelect: (characterId: number) => void

  constructor(backend: FakeBackend, _model: PeopleManagementPageModel, onSelect: (characterId: number) => void = () => undefined) {
    super()
    this.backend = backend
    this.onSelect = onSelect
    void this.runSearch()
  }

  get query(): string { return this.queryValue }
  setQuery = (value: string): void => {
    this.queryValue = value
    void this.runSearch()
  }

  get searching(): boolean { return this.searchingFlag }

  get results(): Array<{ characterId: number; name: string; href: string }> {
    return this.resultsState
  }

  get canSearch(): boolean {
    return this.backend.builder.managementPeopleModel().canOpenPeople
  }

  select = (characterId: number): void => {
    this.backend.log.append('people', 'select', `character ${characterId}`)
    this.onSelect(characterId)
  }

  private async runSearch(): Promise<void> {
    this.searchingFlag = true
    this.emit()
    await this.backend.wait()
    this.resultsState = this.backend.searchMembers(this.queryValue).map(({ id, name, href }) => ({ characterId: id, name, href }))
    this.searchingFlag = false
    this.emit()
  }
}

export class PersonManagementWorkspaceImpl extends MutatingWorkspace implements PersonManagementWorkspace {
  readonly backend: FakeBackend
  private readonly characterId: number
  private filter: 'held' | 'assignable' = 'held'

  constructor(backend: FakeBackend, model: PersonManagementPageModel) {
    super()
    this.backend = backend
    this.characterId = model.character.id
    this.filter = model.roleFilter
  }

  get canManageMembers(): boolean {
    return this.backend.builder.managementPersonModel(this.characterId).canManageMembers
  }

  get roleFilter(): 'held' | 'assignable' { return this.filter }
  setRoleFilter = (value: 'held' | 'assignable'): void => {
    this.filter = value
    this.emit()
  }

  async assignRole(roleId: number): Promise<void> {
    this.beginMutation('assignRole')
    await this.runMutation('roles', 'assign', () => this.backend.assignRole(roleId, this.characterId))
  }

  async unassignRole(roleId: number): Promise<void> {
    this.beginMutation('unassignRole')
    await this.runMutation('roles', 'unassign', () => this.backend.unassignRole(roleId, this.characterId))
  }
}