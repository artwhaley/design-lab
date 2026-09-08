import { useState } from 'react'
import type { Action } from '../source/controls'
import { Modal } from '../source/controls'
import { ObsidianRecords as SourceObsidianRecords, type RecordsViewState } from '../source/ObsidianRecords'
import type { LabPageProps, RecordsPageModel, RecordsWorkspace } from '../../../contracts'
import { folderActionDescriptors, recordActionDescriptors } from '../../../contracts/actions'
import type { ObsidianConfig } from '../config'
import { mapRecordsPageModel } from './sourceMappers'

type RecordsAdapterProps = LabPageProps<RecordsPageModel, ObsidianConfig> & { workspace: RecordsWorkspace }
type Dialog = 'create-folder' | 'rename-folder' | 'delete-folder' | null

export function RecordsAdapter({ model, runtime, workspace: ws }: RecordsAdapterProps) {
  const [view, setView] = useState<'cards' | 'list'>(runtime.config.records.defaultView)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [parentId, setParentId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const sourceModel = mapRecordsPageModel(model)
  const selectedFolder = ws.folders.selected
  const loadedRecords = ws.results.records
  const pageSize = ws.pageSize.value
  const page = Math.max(1, Math.ceil(ws.results.total / pageSize))

  const openFolderDialog = (next: Exclude<Dialog, null>, nextParentId = ws.folders.selectedId) => {
    setDraftError(null)
    setParentId(nextParentId)
    setDraftName(next === 'rename-folder' ? selectedFolder?.name ?? '' : '')
    setDialog(next)
  }

  const folderActions: Action[] = folderActionDescriptors({
    canManageFolders: ws.capabilities.manageFolders,
    selectedFolder,
  })
    .filter((item) => item.enabled)
    .map((item) => ({ key: item.operation, label: item.label, danger: item.operation === 'delete-folder' }))

  const actions: Record<number, Action[]> = Object.fromEntries(
    model.records.map((record) => {
      const isSuperseded = model.supersessionEdges.some((edge) => edge.newerId === record.id)
      const descriptors = recordActionDescriptors({
        baseUrl: model.baseUrl,
        record,
        isSuperseded,
        canActOnRecords: ws.capabilities.actOnRecords,
        canEditLifecycle: record.capabilities.edit,
        deleteActionProvided: false,
      })
      return [record.id, descriptors.filter((item) => item.enabled).map((item) => ({
        key: item.operation,
        label: item.label,
        href: 'href' in item && item.href ? item.href : undefined,
        danger: item.operation === 'delete',
      }))]
    }),
  )

  const onAction = (action: Action) => {
    if (action.key === 'create-folder') openFolderDialog('create-folder', null)
    if (action.key === 'create-subfolder') openFolderDialog('create-folder', ws.folders.selectedId)
    if (action.key === 'rename-folder') openFolderDialog('rename-folder')
    if (action.key === 'delete-folder') openFolderDialog('delete-folder')
    // The frozen source menu invokes this callback even for href actions. The
    // record links remain available in the cards; the Lab RecordsWorkspace has
    // no record-action navigation method to call from a menu item.
  }

  const submitDialog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dialog) return
    if (dialog === 'delete-folder') {
      if (selectedFolder && await ws.mutations.deleteFolder(selectedFolder.id)) setDialog(null)
      else setDraftError(ws.mutations.error ?? 'The folder could not be deleted.')
      return
    }
    const name = draftName.trim()
    if (name.length < 2) {
      setDraftError('Folder name must be at least 2 characters.')
      return
    }
    const ok = dialog === 'rename-folder' && selectedFolder
      ? await ws.mutations.renameFolder(selectedFolder.id, name)
      : await ws.mutations.createFolder(parentId, name)
    if (ok) setDialog(null)
    else setDraftError(ws.mutations.error ?? 'The folder could not be saved.')
  }

  const sourceWorkspace: RecordsViewState = {
    search: ws.search.value,
    setSearch: ws.search.setValue,
    selectedFolder: ws.folders.selectedId,
    selectFolder: ws.folders.select,
    expandedFolders: ws.folders.expandedIds,
    toggleFolder: ws.folders.toggleExpanded,
    includeSubfolders: ws.search.subfolders,
    setIncludeSubfolders: ws.search.setSubfolders,
    type: ws.exposure.typeId == null ? 'all' : String(ws.exposure.typeId),
    setType: (value) => ws.exposure.apply(value === 'all' ? '' : value),
    view,
    setView,
    sort: ws.ordering.value === 'title' ? 'title-asc' : ws.ordering.value,
    setSort: (value) => {
      if (value === 'title-desc') return
      ws.ordering.setValue(value === 'title-asc' ? 'title' : value)
    },
    pageSize,
    setPageSize: ws.pageSize.setValue,
    page,
    pageCount: page + (ws.results.hasMore ? 1 : 0),
    setPage: (next) => {
      if (next > page && ws.results.hasMore) ws.results.loadMore()
    },
    records: loadedRecords,
    resultCount: ws.results.total,
    actions,
    folderActions,
    onAction,
  }

  return (
    <>
      <SourceObsidianRecords model={sourceModel} workspace={sourceWorkspace} />
      {dialog && (
        <Modal
          open
          onOpenChange={(open) => { if (!open) setDialog(null) }}
          title={dialog === 'delete-folder' ? 'Delete folder' : dialog === 'rename-folder' ? 'Rename folder' : 'Create folder'}
          description={dialog === 'delete-folder' ? `Delete “${selectedFolder?.name ?? ''}”?` : 'Folder name'}
        >
          <form onSubmit={(event) => void submitDialog(event)}>
            {dialog !== 'delete-folder' && (
              <label>
                Name
                <input aria-label="Folder name" value={draftName} onChange={(event) => setDraftName(event.target.value)} autoFocus />
              </label>
            )}
            {draftError && <p role="alert">{draftError}</p>}
            <button type="submit">{dialog === 'delete-folder' ? 'Delete' : dialog === 'rename-folder' ? 'Rename' : 'Create'}</button>
          </form>
        </Modal>
      )}
    </>
  )
}
