/**
 * Action/capability descriptors (Bible §54). A Design renders exactly what is
 * supplied: `available`, `disabled` (visible but unavailable, with reason), or
 * `absent` (do not offer). Absent must never be converted into disabled just
 * to balance a toolbar.
 */
import type { FolderSummary, RecordSummary } from './pageModels'

export type ActionAvailability = 'available' | 'disabled' | 'absent'

export type ActionKind = 'default' | 'primary' | 'destructive'

export type ActionDescriptor = {
  key: string
  label: string
  kind: ActionKind
  state: ActionAvailability
  disabledReason?: string
}

// ---------------------------------------------------------------------------
// Records operation descriptors (mirrors production presentation/operations)
// ---------------------------------------------------------------------------

export type RecordOperationKey = 'view' | 'edit' | 'supersede' | 'delete'
export type FolderOperationKey = 'create-folder' | 'create-subfolder' | 'rename-folder' | 'delete-folder'
export type RecordsDialogIntent = 'create-folder' | 'rename-folder' | 'delete-folder'

export type RecordLinkDescriptor = {
  operation: 'view' | 'edit' | 'supersede'
  label: string
  href: string | null
  enabled: boolean
}

export type RecordDeleteDescriptor = {
  operation: 'delete'
  label: string
  enabled: boolean
}

export type RecordActionDescriptor = RecordLinkDescriptor | RecordDeleteDescriptor

export type FolderActionDescriptor = {
  operation: FolderOperationKey
  label: string
  dialog: RecordsDialogIntent
  enabled: boolean
}

export const recordViewHref = (baseUrl: string, recordId: number): string => `${baseUrl}/documents/${recordId}`
export const recordEditHref = (baseUrl: string, recordId: number): string => `${baseUrl}/documents/${recordId}/edit`
export const recordSupersedeHref = (baseUrl: string, recordId: number): string => `${baseUrl}/records/new?supersedes=${recordId}`
export const newRecordHref = (baseUrl: string, folderId: number | null): string => folderId == null ? `${baseUrl}/records/new` : `${baseUrl}/records/new?folder=${folderId}`
export const importNotecardHref = (baseUrl: string): string => `${baseUrl}/import`
export const recordsReturnTo = (baseUrl: string, folderId: number | null): string => folderId == null ? `${baseUrl}/records` : `${baseUrl}/records?folder=${folderId}`

/**
 * Record actions for one target. `record` may be null (nothing selected):
 * every action then reports disabled with no href so toolbars render a
 * consistent non-destructive surface before any row is chosen. Legal
 * transitions are NOT derived from lifecycle strings here — capabilities come
 * from the model; lifecycle only gates the well-known production rules.
 */
export function recordActionDescriptors(input: {
  baseUrl: string
  record: RecordSummary | null
  isSuperseded: boolean
  canActOnRecords: boolean
  canEditLifecycle: boolean
  deleteActionProvided: boolean
}): RecordActionDescriptor[] {
  const { baseUrl, record, isSuperseded, canActOnRecords, canEditLifecycle, deleteActionProvided } = input
  const canEdit = record !== null && !isSuperseded && record.capabilities.edit && canEditLifecycle
  const canSupersede = record !== null && !isSuperseded && canActOnRecords && record.capabilities.supersede
  const canDelete = record !== null && canActOnRecords && deleteActionProvided && record.capabilities.delete
  return [
    { operation: 'view', label: 'View', href: record ? recordViewHref(baseUrl, record.id) : null, enabled: record !== null },
    { operation: 'edit', label: 'Edit', href: canEdit ? recordEditHref(baseUrl, record.id) : null, enabled: canEdit },
    { operation: 'supersede', label: 'Supersede', href: canSupersede ? recordSupersedeHref(baseUrl, record.id) : null, enabled: canSupersede },
    { operation: 'delete', label: 'Delete', enabled: canDelete },
  ]
}

export function folderActionDescriptors(input: {
  canManageFolders: boolean
  selectedFolder: FolderSummary | null
}): FolderActionDescriptor[] {
  const { canManageFolders, selectedFolder } = input
  const canEditSelected = canManageFolders && selectedFolder !== null && !selectedFolder.systemManaged
  return [
    { operation: 'create-folder', label: 'Create folder', dialog: 'create-folder', enabled: canManageFolders },
    { operation: 'create-subfolder', label: 'Create subfolder', dialog: 'create-folder', enabled: canManageFolders },
    { operation: 'rename-folder', label: 'Rename folder', dialog: 'rename-folder', enabled: canEditSelected },
    { operation: 'delete-folder', label: 'Delete folder', dialog: 'delete-folder', enabled: canEditSelected },
  ]
}

// ---------------------------------------------------------------------------
// Document action bridge
// ---------------------------------------------------------------------------

export type DocumentActionResult = {
  ok: boolean
  message: string
}

/**
 * The Document surface receives supplied actions rather than inventing
 * lifecycle logic (Bible §20). The bridge lists which actions exist for THIS
 * document + viewer and executes them against the fake backend. Destructive
 * actions are confirmed by the Lab host before `run` is invoked.
 */
export interface DocumentActionBridge {
  actions: ActionDescriptor[]
  run(actionKey: string): Promise<DocumentActionResult>
}