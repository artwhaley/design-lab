/**
 * DocumentTypesManagementWorkspaceImpl — fake Document-Type management (T05).
 * Preserves Department-root / manual-folder / virtual-Unassigned / type
 * distinctions from the model; selection + supported mutations only.
 */
import type { DocumentTypeTemplateMode, DocumentTypesManagementPageModel, DocumentTypesManagementWorkspace, DocumentTypeTreeNode } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

function collectTypeIds(nodes: DocumentTypeTreeNode[]): number[] {
  const ids: number[] = []
  for (const node of nodes) {
    if (node.kind === 'document-type') ids.push(node.id)
    ids.push(...collectTypeIds(node.children))
  }
  return ids
}

export class DocumentTypesManagementWorkspaceImpl extends MutatingWorkspace implements DocumentTypesManagementWorkspace {
  readonly backend: FakeBackend

  private selectedType: number | null = null

  constructor(backend: FakeBackend, _model: DocumentTypesManagementPageModel) {
    super()
    this.backend = backend
  }

  private model(): DocumentTypesManagementPageModel {
    return this.backend.builder.managementDocumentTypesModel()
  }

  get tree(): DocumentTypeTreeNode[] {
    return this.model().tree
  }

  get selectedTypeId(): number | null {
    const ids = new Set(collectTypeIds(this.tree))
    return this.selectedType !== null && ids.has(this.selectedType) ? this.selectedType : null
  }

  select = (id: number | null): void => {
    this.selectedType = id
    this.emit()
  }

  get canManage(): boolean {
    return this.model().canManage
  }

  async createType(input: { name: string; parentId: number | null; templateMode: DocumentTypeTemplateMode }): Promise<void> {
    this.beginMutation('createType')
    // Map a department-root tree node id to a departmentRootId for the backend.
    const rootId = this.tree.find((node) => node.kind === 'department-root' && node.id === input.parentId) ? input.parentId : null
    const result = await this.runMutation('documentTypes', 'create', () => this.backend.createDocumentType({ name: input.name, departmentRootId: rootId, templateMode: input.templateMode }))
    if (result.ok) {
      const types = this.backend.builder.universe.documentTypes
      this.selectedType = types[types.length - 1]?.id ?? null
    }
  }

  async duplicateType(id: number): Promise<void> {
    this.beginMutation('duplicateType')
    await this.runMutation('documentTypes', 'duplicate', () => this.backend.duplicateDocumentType(id))
  }

  async archiveType(id: number): Promise<void> {
    this.beginMutation('archiveType')
    await this.runMutation('documentTypes', 'archive', () => this.backend.setDocumentTypeArchived(id, true, 'archive'))
  }

  async restoreType(id: number): Promise<void> {
    this.beginMutation('restoreType')
    await this.runMutation('documentTypes', 'restore', () => this.backend.setDocumentTypeArchived(id, false, 'restore'))
  }

  async renameType(id: number, name: string): Promise<void> {
    this.beginMutation('renameType')
    await this.runMutation('documentTypes', 'rename', () => this.backend.renameDocumentType(id, name))
  }
}