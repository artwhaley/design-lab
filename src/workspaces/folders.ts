/**
 * FoldersManagementWorkspaceImpl — fake Folder-management behavior (T05).
 * Tree data comes from the model; selection/expansion/search/sort are
 * workspace UI state; mutations go through the backend with descendant-cycle
 * rejection and system-managed restrictions.
 */
import type { FolderManagementNode, FolderManagementPageModel, FoldersManagementWorkspace } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

function filterByName(node: FolderManagementNode, query: string): FolderManagementNode | null {
  const children = node.children.map((child) => filterByName(child, query)).filter((child): child is FolderManagementNode => child !== null)
  if (node.name.toLocaleLowerCase().includes(query) || children.length > 0) {
    return { ...node, children }
  }
  return null
}

function sortNodes(nodes: FolderManagementNode[], sort: 'name' | 'created'): FolderManagementNode[] {
  const sorted = [...nodes].sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : a.createdAt.localeCompare(b.createdAt))
  return sorted.map((node) => ({ ...node, children: sortNodes(node.children, sort) }))
}

export class FoldersManagementWorkspaceImpl extends MutatingWorkspace implements FoldersManagementWorkspace {
  readonly backend: FakeBackend

  private selected: number | null = null
  private expanded = new Set<number>()
  private searchValue = ''
  private sortValue: 'name' | 'created' = 'name'

  constructor(backend: FakeBackend, model: FolderManagementPageModel) {
    super()
    this.backend = backend
    const visit = (nodes: FolderManagementNode[]) => nodes.forEach((node) => { if (node.children.length > 0) this.expanded.add(node.id); visit(node.children) })
    visit(model.nodes)
  }

  get nodes(): FolderManagementNode[] {
    const model = this.backend.builder.managementFoldersModel()
    const query = this.searchValue.trim().toLocaleLowerCase()
    const filtered = query ? model.nodes.map((n) => filterByName(n, query)).filter((n): n is FolderManagementNode => n !== null) : model.nodes
    return sortNodes(filtered, this.sortValue)
  }

  get selectedId(): number | null { return this.selected }
  select = (id: number | null): void => {
    this.selected = id
    this.emit()
  }

  get expandedIds(): ReadonlySet<number> { return this.expanded }
  toggleExpanded = (id: number): void => {
    if (this.expanded.has(id)) this.expanded.delete(id)
    else this.expanded.add(id)
    this.emit()
  }

  get search(): string { return this.searchValue }
  setSearch = (value: string): void => {
    this.searchValue = value
    this.emit()
  }

  get sort(): 'name' | 'created' { return this.sortValue }
  setSort = (value: 'name' | 'created'): void => {
    this.sortValue = value
    this.emit()
  }

  get canCreateRoot(): boolean {
    return this.backend.projection.canManageFolders
  }

  async createFolder(parentId: number | null, name: string): Promise<void> {
    this.beginMutation('createFolder')
    const result = await this.runMutation('folders', 'create', () => this.backend.createFolder(parentId, name))
    if (result.ok) this.selected = parentId
  }

  async renameFolder(id: number, name: string): Promise<void> {
    this.beginMutation('renameFolder')
    await this.runMutation('folders', 'rename', () => this.backend.renameFolder(id, name))
  }

  async moveFolder(id: number, targetParentId: number | null): Promise<boolean> {
    this.beginMutation('moveFolder')
    const result = await this.runMutation('folders', 'move', () => this.backend.moveFolder(id, targetParentId))
    return result.ok
  }

  async deleteFolder(id: number): Promise<void> {
    this.beginMutation('deleteFolder')
    const result = await this.runMutation('folders', 'delete', () => this.backend.deleteFolder(id))
    if (result.ok && this.selected === id) this.selected = null
  }
}