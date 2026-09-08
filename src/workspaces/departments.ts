/**
 * DepartmentsManagementWorkspaceImpl — fake Department management (T05).
 * Create/archive/restore/rename only as supported by the target contract.
 */
import type { DepartmentsManagementPageModel, DepartmentsManagementRow, DepartmentsManagementWorkspace } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

export class DepartmentsManagementWorkspaceImpl extends MutatingWorkspace implements DepartmentsManagementWorkspace {
  readonly backend: FakeBackend

  constructor(backend: FakeBackend, _model: DepartmentsManagementPageModel) {
    super()
    this.backend = backend
  }

  private model(): DepartmentsManagementPageModel {
    return this.backend.builder.managementDepartmentsModel()
  }

  get departments(): DepartmentsManagementRow[] {
    return this.model().departments
  }

  get canCreate(): boolean {
    return this.model().canCreate
  }

  async createDepartment(input: { name: string; description: string }): Promise<void> {
    this.beginMutation('createDepartment')
    await this.runMutation('departments', 'create', () => this.backend.createDepartment(input))
  }

  async archiveDepartment(id: number): Promise<void> {
    this.beginMutation('archiveDepartment')
    await this.runMutation('departments', 'archive', () => this.backend.archiveDepartment(id))
  }

  async restoreDepartment(id: number): Promise<void> {
    this.beginMutation('restoreDepartment')
    await this.runMutation('departments', 'restore', () => this.backend.restoreDepartment(id))
  }

  async renameDepartment(id: number, name: string): Promise<void> {
    this.beginMutation('renameDepartment')
    await this.runMutation('departments', 'rename', () => this.backend.renameDepartment(id, name))
  }
}