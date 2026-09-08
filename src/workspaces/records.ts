/**
 * RecordsWorkspaceImpl — host-owned fake Records query behavior (T04).
 *
 * Search/filter/order/batch/load-more all live HERE, never in a Design
 * (Bible §19 "Records query rule"). The backend projection has already
 * authorized rows; this layer emulates the shared query contract on top.
 */
import type {
  FolderSummary,
  RecordsCapabilities,
  RecordsDialog,
  RecordsContextMenu,
  RecordsOrdering,
  RecordsPageModel,
  RecordsWorkspace,
  RecordSummary,
  SupersessionEdge,
} from '../contracts'
import { recordsReturnTo } from '../contracts/actions'
import { WorkspaceBase } from './base'
import type { FakeBackend } from './backend'
import { buildSupersessionTrees, isSuperseded } from './supersession'

type QueryState = {
  search: string
  subfolders: boolean
  selectedFolderId: number | null
  exposedTypeId: number | null
  typeChoice: string
  ordering: RecordsOrdering
  pageSize: number
}

function descendantIdsOf(folder: FolderSummary): number[] {
  return [folder.id, ...folder.children.flatMap(descendantIdsOf)]
}

function filterFolders(node: FolderSummary, matching: Set<number>): FolderSummary | null {
  const children = node.children.map((child) => filterFolders(child, matching)).filter((child): child is FolderSummary => child !== null)
  return matching.has(node.id) || children.length > 0 ? { ...node, children } : null
}

export class RecordsWorkspaceImpl extends WorkspaceBase implements RecordsWorkspace {
  readonly backend: FakeBackend
  readonly capabilities: RecordsCapabilities
  readonly vocabulary: RecordsPageModel['vocabulary']

  search!: RecordsWorkspace['search']
  folders!: RecordsWorkspace['folders']
  results!: RecordsWorkspace['results']
  selection!: RecordsWorkspace['selection']
  actions!: RecordsWorkspace['actions']
  exposure!: RecordsWorkspace['exposure']
  ordering!: RecordsWorkspace['ordering']
  pageSize!: RecordsWorkspace['pageSize']
  mutations!: RecordsWorkspace['mutations']
  reset!: () => void

  private queryState: QueryState = {
    search: '',
    subfolders: true,
    selectedFolderId: null,
    exposedTypeId: null,
    typeChoice: '',
    ordering: 'newest',
    pageSize: 12,
  }

  private expanded = new Set<number>()
  private rawSelectedRecordId: number | null = null
  private dialog: RecordsDialog = null
  private menu: RecordsContextMenu = null
  private error: string | null = null
  private searching = false
  private loadingMore = false
  private pending: string | null = null
  private materialized = 0

  constructor(backend: FakeBackend, model: RecordsPageModel) {
    super()
    this.backend = backend
    this.capabilities = model.capabilities
    this.vocabulary = model.vocabulary
    for (const folder of model.folders) {
      const visit = (node: FolderSummary) => {
        if (node.children.length > 0) this.expanded.add(node.id)
        node.children.forEach(visit)
      }
      visit(folder)
    }
    this.buildInterface()
  }

  // --- interface construction (getters capture the instance) -----------------

  private buildInterface(): void {
    const self = this
    const emit = () => self.emit()

    this.search = {
      get value() { return self.queryState.search },
      setValue: (value: string) => {
        self.queryState.search = value
        self.rawSelectedRecordId = null
        self.materialized = 0
        void self.refresh('records.search')
      },
      get active() { return self.queryState.search.trim().length > 0 },
      get loading() { return self.searching },
      get subfolders() { return self.queryState.subfolders },
      setSubfolders: (value: boolean) => {
        self.queryState.subfolders = value
        void self.refresh('records.search')
      },
    }

    this.folders = {
      get list() { return self.visibleFolders() },
      get byId() { return self.folderById() },
      get selectedId() { return self.queryState.selectedFolderId },
      select: (id: number | null) => {
        self.queryState.selectedFolderId = id
        self.rawSelectedRecordId = null
        self.materialized = 0
        void self.refresh('records.folderSelect')
      },
      get expandedIds() { return self.expanded },
      toggleExpanded: (id: number) => {
        if (self.expanded.has(id)) self.expanded.delete(id)
        else self.expanded.add(id)
        emit()
      },
      get selected() { return self.queryState.selectedFolderId !== null ? self.folderById().get(self.queryState.selectedFolderId) ?? null : null },
      get descendantIds() {
        const selected = self.folders.selected
        return selected ? new Set(descendantIdsOf(selected)) : null
      },
    }

    this.results = {
      get records() { return self.pageOf(self.matchingRecords()) },
      get trees() { return buildSupersessionTrees(self.pageOf(self.matchingRecords()), self.activeEdges()) },
      get edges() { return self.activeEdges() },
      loadMore: () => { void self.loadMore() },
      get hasMore() { return self.materialized + self.queryState.pageSize < self.matchingRecords().length },
      get loadingMore() { return self.loadingMore },
      get counts() { return self.folderCounts() },
      get total() { return self.model().totalReadableRecordCount },
      get rootCount() {
        const model = self.model()
        if (self.queryState.exposedTypeId === null) return model.totalReadableRecordCount
        return model.records.filter((r) => r.documentTypeId === self.queryState.exposedTypeId).length
      },
      get loading() { return self.searching || self.backend.loadingOverride },
      get error() { return self.error },
    }

    this.selection = {
      get recordId() {
        const rows = self.matchingRecords()
        return self.rawSelectedRecordId !== null && rows.some((r) => r.id === self.rawSelectedRecordId) ? self.rawSelectedRecordId : null
      },
      selectRecord: (id: number | null) => {
        self.rawSelectedRecordId = id
        emit()
      },
      get selected() {
        const rows = self.matchingRecords()
        return self.selection.recordId !== null ? rows.find((r) => r.id === self.selection.recordId) ?? null : null
      },
      get isSuperseded() {
        const selected = self.selection.selected
        return selected ? isSuperseded(selected.id, self.activeEdges()) : false
      },
    }

    this.actions = {
      get dialog() { return self.dialog },
      setDialog: (dialog: RecordsDialog) => {
        self.dialog = dialog
        emit()
      },
      get menu() { return self.menu },
      setMenu: (menu: RecordsContextMenu) => {
        self.menu = menu
        emit()
      },
      get returnTo() { return recordsReturnTo(self.model().baseUrl, self.queryState.selectedFolderId) },
    }

    this.exposure = {
      get typeId() { return self.queryState.exposedTypeId },
      apply: (choice: string) => {
        self.queryState.exposedTypeId = choice ? Number(choice) : null
        self.queryState.typeChoice = choice
        self.rawSelectedRecordId = null
        self.materialized = 0
        void self.refresh('records.typeExpose')
      },
      get typeChoice() { return self.queryState.typeChoice },
      setTypeChoice: (value: string) => {
        self.queryState.typeChoice = value
        emit()
      },
      get typeName() {
        const model = self.model()
        if (self.queryState.exposedTypeId === null) return null
        return model.documentTypes.find((t) => t.id === self.queryState.exposedTypeId)?.name ?? null
      },
    }

    this.ordering = {
      get value() { return self.queryState.ordering },
      setValue: (value: RecordsOrdering) => {
        self.queryState.ordering = value
        self.materialized = 0
        void self.refresh('records.order')
      },
    }

    this.pageSize = {
      get value() { return self.queryState.pageSize },
      setValue: (value: number) => {
        self.queryState.pageSize = value
        self.materialized = 0
        void self.refresh('records.pageSize')
      },
    }

    this.mutations = {
      get pending() { return self.pending },
      get error() { return self.error },
      createFolder: (parentId: number | null, name: string) => self.createFolder(parentId, name),
      renameFolder: (id: number, name: string) => self.renameFolder(id, name),
      deleteFolder: (id: number) => self.deleteFolder(id),
    }

    this.reset = () => {
      self.queryState = { search: '', subfolders: true, selectedFolderId: null, exposedTypeId: null, typeChoice: '', ordering: 'newest', pageSize: 12 }
      self.rawSelectedRecordId = null
      self.dialog = null
      self.menu = null
      self.error = null
      self.materialized = 0
      emit()
    }
  }

  // --- internals --------------------------------------------------------------

  private model(): RecordsPageModel {
    return this.backend.builder.recordsModel()
  }

  private folderById(): Map<number, FolderSummary> {
    const byId = new Map<number, FolderSummary>()
    const visit = (nodes: FolderSummary[]) => nodes.forEach((folder) => { byId.set(folder.id, folder); visit(folder.children) })
    visit(this.model().folders)
    return byId
  }

  private visibleFolders(): FolderSummary[] {
    const model = this.model()
    if (this.queryState.exposedTypeId === null) return model.folders
    const matching = new Set<number>(model.records.filter((r) => r.documentTypeId === this.queryState.exposedTypeId && r.folderId !== null).map((r) => r.folderId as number))
    return model.folders.map((folder) => filterFolders(folder, matching)).filter((folder): folder is FolderSummary => folder !== null)
  }

  private matchingRecords(): RecordSummary[] {
    const model = this.model()
    const { search, selectedFolderId, exposedTypeId, subfolders, ordering } = this.queryState
    const normalized = search.trim().toLocaleLowerCase()
    const selected = selectedFolderId !== null ? this.folderById().get(selectedFolderId) ?? null : null
    const descendants = selected ? new Set(descendantIdsOf(selected)) : null
    let rows = model.records.filter((record) => {
      if (exposedTypeId !== null && record.documentTypeId !== exposedTypeId) return false
      if (selectedFolderId !== null) {
        const inSelected = record.folderId === selectedFolderId
        const inDescendant = descendants?.has(record.folderId ?? -1) ?? false
        // Mirrors production: subfolder scope applies while searching; without
        // a search, selection narrows to the selected folder itself.
        if (normalized && subfolders ? !inDescendant : !inSelected) return false
      }
      return !normalized || record.title.toLocaleLowerCase().includes(normalized)
    })
    rows = [...rows].sort((a, b) => {
      if (ordering === 'title') return a.title.localeCompare(b.title)
      return ordering === 'oldest' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)
    })
    return rows
  }

  private pageOf(rows: RecordSummary[]): RecordSummary[] {
    return rows.slice(0, this.materialized + this.queryState.pageSize)
  }

  private folderCounts(): Map<number, number> {
    const counts = new Map<number, number>()
    const model = this.model()
    for (const record of model.records) {
      if (record.folderId === null) continue
      if (this.queryState.exposedTypeId !== null && record.documentTypeId !== this.queryState.exposedTypeId) continue
      counts.set(record.folderId, (counts.get(record.folderId) ?? 0) + 1)
    }
    return counts
  }

  private activeEdges(): SupersessionEdge[] {
    return this.model().supersessionEdges
  }

  private async refresh(scope: string): Promise<void> {
    this.searching = true
    this.emit()
    if (this.backend.consumeFail()) {
      this.searching = false
      this.error = 'The requested data could not be read (simulated failure).'
      this.emit()
      return
    }
    if (this.backend.readError) {
      this.searching = false
      this.error = 'The current surface failed to load (read error state).'
      this.emit()
      return
    }
    await this.backend.wait()
    this.searching = false
    this.error = null
    this.backend.log.append(scope, 'query', `${this.queryState.search.trim() || 'all'} in ${this.queryState.selectedFolderId ?? 'root'}`)
    this.emit()
  }

  private async loadMore(): Promise<void> {
    if (this.loadingMore) return
    this.loadingMore = true
    this.emit()
    await this.backend.wait()
    this.loadingMore = false
    this.materialized += this.queryState.pageSize
    this.backend.log.append('records', 'loadMore', `+${this.queryState.pageSize}`)
    this.emit()
  }

  private async createFolder(parentId: number | null, name: string): Promise<boolean> {
    this.pending = 'createFolder'
    this.emit()
    if (this.backend.consumeFail()) {
      this.pending = null
      this.error = 'The last mutation failed (simulated).'
      this.backend.log.append('folders', 'create', 'failed (simulated)', 'error')
      this.emit()
      return false
    }
    await this.backend.wait()
    const result = this.backend.createFolder(parentId, name)
    this.pending = null
    if (result.ok) this.dialog = null
    else this.error = result.error ?? 'Folder creation failed.'
    this.emit()
    return result.ok
  }

  private async renameFolder(id: number, name: string): Promise<boolean> {
    this.pending = 'renameFolder'
    this.emit()
    if (this.backend.consumeFail()) {
      this.pending = null
      this.error = 'The last mutation failed (simulated).'
      this.backend.log.append('folders', 'rename', 'failed (simulated)', 'error')
      this.emit()
      return false
    }
    await this.backend.wait()
    const result = this.backend.renameFolder(id, name)
    this.pending = null
    if (result.ok) this.dialog = null
    else this.error = result.error ?? 'Folder rename failed.'
    this.emit()
    return result.ok
  }

  private async deleteFolder(id: number): Promise<boolean> {
    this.pending = 'deleteFolder'
    this.emit()
    if (this.backend.consumeFail()) {
      this.pending = null
      this.error = 'The last mutation failed (simulated).'
      this.backend.log.append('folders', 'delete', 'failed (simulated)', 'error')
      this.emit()
      return false
    }
    await this.backend.wait()
    const result = this.backend.deleteFolder(id)
    this.pending = null
    if (result.ok) {
      this.dialog = null
      this.queryState.selectedFolderId = null
    } else {
      this.error = result.error ?? 'Folder deletion failed.'
    }
    this.emit()
    return result.ok
  }
}