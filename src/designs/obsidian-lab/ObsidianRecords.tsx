/**
 * Obsidian Records — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianRecords.tsx),
 * adapted to the Lab RecordsWorkspace. The incubation's mock "view state"
 * becomes a thin adapter over the Lab workspace: search, folder scope,
 * subfolder toggle, type exposure, ordering, page size, and load-more all
 * remain owned by the shared workspace (Bible §19). The card/list view
 * toggle is Design-local. The incubation's page-based pager is replaced by
 * the Lab's load-more semantics, and the incubation's record/folder action
 * menus are wired to the Lab action descriptors + folder mutations.
 */
import { useState } from 'react'
import { Collapsible, ToggleGroup } from 'radix-ui'
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Check,
  Folder,
  FolderOpen,
  Folders,
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  LockKeyhole,
  CornerDownRight,
  X,
  LayoutGrid,
  List,
  PenLine,
  Trash2,
} from 'lucide-react'
import type { LabPageProps, RecordsPageModel, RecordsWorkspace } from '../../contracts'
import { folderActionDescriptors, newRecordHref, importNotecardHref, recordActionDescriptors } from '../../contracts/actions'
import type { ObsidianConfig } from './config'
import { ActionMenu, ChoiceMenu, Modal, type Action } from './controls'
import s from './obsidian.module.css'

export function ObsidianRecords({ model, runtime, workspace: ws }: LabPageProps<RecordsPageModel, ObsidianConfig> & { workspace: RecordsWorkspace }) {
  const [foldersOpen, setFoldersOpen] = useState(false)
  const [view, setView] = useState<'cards' | 'list'>(runtime.config.records.defaultView)
  const [draftName, setDraftName] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)

  const selectedFolder = findFolder(model.folders, ws.folders.selectedId)
  const typeChoice = ws.exposure.typeId == null ? 'all' : String(ws.exposure.typeId)
  const pageSize = ws.pageSize.value

  const runFolderAction = (dialog: 'create-folder' | 'rename-folder' | 'delete-folder') => {
    setDraftError(null)
    if (dialog === 'create-folder') {
      setDraftName('')
      ws.actions.setDialog('create-folder')
      return
    }
    if (dialog === 'rename-folder') {
      const target = ws.folders.selected
      if (!target) return
      setDraftName(target.name)
      ws.actions.setDialog('rename-folder')
      return
    }
    if (dialog === 'delete-folder') {
      if (ws.folders.selected) ws.actions.setDialog('delete-folder')
    }
  }

  const submitDialog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const dialog = ws.actions.dialog
    if (!dialog) return
    const name = draftName.trim()
    if (dialog === 'delete-folder') {
      const target = ws.folders.selected
      if (target) {
        const ok = await ws.mutations.deleteFolder(target.id)
        if (ok) ws.actions.setDialog(null)
        else setDraftError(ws.mutations.error ?? 'Delete failed.')
      }
      return
    }
    if (name.length < 2) {
      setDraftError('Folder name must be at least 2 characters.')
      return
    }
    const target = ws.folders.selected
    const ok = dialog === 'rename-folder' && target
      ? await ws.mutations.renameFolder(target.id, name)
      : await ws.mutations.createFolder(target ? target.id : null, name)
    if (ok) ws.actions.setDialog(null)
    else setDraftError(ws.mutations.error ?? 'The folder could not be saved.')
  }

  const folderItems: Action[] = folderActionDescriptors({
    canManageFolders: ws.capabilities.manageFolders,
    selectedFolder: ws.folders.selected,
  })
    .filter((op) => op.enabled)
    .map((op) => ({ key: op.operation, label: op.label, danger: op.operation === 'delete-folder' }))

  const recordActions = (record: RecordsPageModel['records'][number]): Action[] => {
    const isSuperseded = model.supersessionEdges.some((edge) => edge.newerId === record.id)
    return recordActionDescriptors({
      baseUrl: model.baseUrl,
      record,
      isSuperseded,
      canActOnRecords: ws.capabilities.actOnRecords,
      canEditLifecycle: record.capabilities.edit,
      deleteActionProvided: false, // record delete lives on the Document bridge; surface pressure in INTEGRATION_NOTES
    })
      .filter((op) => op.enabled)
      .map((op) => ({ key: op.operation, label: op.label, href: 'href' in op && op.href ? op.href : undefined, danger: op.operation === 'delete' }))
  }

  function folderTree(folder: NonNullable<RecordsPageModel['folders'][number]>, depth = 0) {
    return (
      <Collapsible.Root key={folder.id} open={ws.folders.expandedIds.has(folder.id)} onOpenChange={() => ws.folders.toggleExpanded(folder.id)}>
        <div className={`${s.folderLine} ${ws.folders.selectedId === folder.id ? s.selectedFolder : ''}`} style={{ paddingLeft: `${10 + depth * 16}px` }}>
          {folder.children.length > 0 ? (
            <Collapsible.Trigger className={s.folderExpand} aria-label={`${ws.folders.expandedIds.has(folder.id) ? 'Collapse' : 'Expand'} ${folder.name}`}>
              <ChevronRight size={13} />
            </Collapsible.Trigger>
          ) : (
            <span className={s.folderSpacer} />
          )}
          <button onClick={() => { ws.folders.select(folder.id); setFoldersOpen(false) }}>
            {ws.folders.selectedId === folder.id ? <FolderOpen size={17} /> : <Folder size={17} />}
            <span>{folder.name}</span>
            <small>{folder.readableRecordCount}</small>
          </button>
        </div>
        <Collapsible.Content>{folder.children.map((child) => folderTree(child, depth + 1))}</Collapsible.Content>
      </Collapsible.Root>
    )
  }

  const records = ws.results.records
  const resultCount = records.length

  return (
    <div className={s.workspacePage}>
      <div className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>THE DOMAIN ARCHIVE</p>
          <h1>Records<span className={s.titleDot}>.</span></h1>
          <p>Every story leaves a trace.</p>
        </div>
        <div className={s.pageActions}>
          {model.capabilities.actOnRecords && (
            <>
              <a className={s.secondaryButton} href={importNotecardHref(model.baseUrl)}><Upload size={16} /> Import</a>
              <a className={s.primaryButton} href={newRecordHref(model.baseUrl, ws.folders.selectedId)}><Plus size={17} /> New document</a>
            </>
          )}
        </div>
      </div>
      <div className={s.archive}>
        <aside className={s.folderPanel} aria-label="Archive folders">
          <div className={s.folderHeading}>
            <span className={s.eyebrow}>COLLECTIONS</span>
            {model.capabilities.manageFolders && folderItems.length > 0 && (
              <span className={s.folderQuickActions}>
                {folderItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    className={item.danger ? s.folderQuickDanger : undefined}
                    onClick={() => void runFolderAction(item.key as 'create-folder' | 'rename-folder' | 'delete-folder')}
                  >
                    {item.key === 'create-folder' || item.key === 'create-subfolder' ? <Plus size={15} /> : item.key === 'rename-folder' ? <PenLine size={14} /> : <Trash2 size={14} />}
                  </button>
                ))}
              </span>
            )}
          </div>
          <button className={`${s.allRecords} ${ws.folders.selectedId === null ? s.selectedFolder : ''}`} onClick={() => ws.folders.select(null)}>
            <Folders size={18} /><span>All records</span><small>{model.totalReadableRecordCount}</small>
          </button>
          <div className={s.folderTree}>{model.folders.map((folder) => folderTree(folder))}</div>
          <div className={s.folderNote}>
            <span className={s.liveDot} /> THE DOMAIN ARCHIVE
            <p>{model.totalReadableRecordCount} readable records</p>
          </div>
        </aside>
        <Modal open={foldersOpen} onOpenChange={setFoldersOpen} title="Collections" description="Browse the domain archive.">
          <div className={s.mobileFolderList}>
            <button className={`${s.allRecords} ${ws.folders.selectedId === null ? s.selectedFolder : ''}`} onClick={() => { ws.folders.select(null); setFoldersOpen(false) }}>
              <Folders size={18} /><span>All records</span><small>{model.totalReadableRecordCount}</small>
            </button>
            {model.folders.map((folder) => folderTree(folder))}
            {model.capabilities.manageFolders && folderItems.length > 0 && (
              <div className={s.folderQuickActions}>
                {folderItems.map((item) => (
                  <button key={item.key} type="button" className={s.menuTrigger} onClick={() => { setFoldersOpen(false); void runFolderAction(item.key as 'create-folder' | 'rename-folder' | 'delete-folder') }}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
        <section className={s.recordsPanel} aria-label="Records">
          <div className={s.archiveToolbar}>
            <button className={s.mobileFolderButton} onClick={() => setFoldersOpen(!foldersOpen)} aria-expanded={foldersOpen}>
              <Folders size={19} /> Folders
            </button>
            <label className={s.search}>
              <Search size={19} />
              <input value={ws.search.value} onChange={(e) => ws.search.setValue(e.target.value)} placeholder="Search the archive…" aria-label="Search records" />
              {ws.search.value && <button aria-label="Clear search" onClick={() => ws.search.setValue('')}><X size={15} /></button>}
            </label>
            <ChoiceMenu
              label="Document type"
              value={typeChoice}
              onChange={(value) => ws.exposure.apply(value)}
              choices={[{ value: 'all', label: 'All types' }, ...model.documentTypes.map((type) => ({ value: String(type.id), label: type.name }))]}
            />
          </div>
          <div className={s.resultsHeading}>
            <div>
              <span>{selectedFolder?.name ?? 'All records'}</span>
              <small aria-live="polite">{resultCount} records shown</small>
            </div>
            <div className={s.resultControls}>
              <label className={s.checkbox}>
                <input type="checkbox" checked={ws.search.subfolders} onChange={(e) => ws.search.setSubfolders(e.target.checked)} />
                <Check size={12} />
                <span>Include subfolders</span>
              </label>
              <ChoiceMenu
                label="Sort records"
                value={ws.ordering.value}
                onChange={(value) => ws.ordering.setValue(value as RecordsWorkspace['ordering']['value'])}
                choices={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'title', label: 'Title A–Z' },
                ]}
              />
              <ToggleGroup.Root className={s.viewToggle} type="single" value={view} onValueChange={(value) => { if (value === 'cards' || value === 'list') setView(value) }} aria-label="Records view">
                <ToggleGroup.Item value="cards" aria-label="Card view"><LayoutGrid size={16} /></ToggleGroup.Item>
                <ToggleGroup.Item value="list" aria-label="List view"><List size={17} /></ToggleGroup.Item>
              </ToggleGroup.Root>
            </div>
          </div>
          {ws.results.loading ? <p className={s.loadingNote} role="status">Loading records…</p> : null}
          <div className={view === 'cards' ? s.recordGrid : s.recordList}>
            {records.map((record) => {
              const type = model.documentTypes.find((t) => t.id === record.documentTypeId)?.name
              const predecessor = model.supersessionEdges.find((edge) => edge.newerId === record.id)
              const successor = model.supersessionEdges.find((edge) => edge.olderId === record.id)
              const lifecycle = successor ? 'Superseded' : record.lifecycle
              const formattedDate = new Date(record.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
              if (view === 'list') {
                return (
                  <article key={record.id} className={`${s.recordRow} ${successor ? s.supersededRow : ''}`}>
                    <a className={s.rowTitle} href={`${model.baseUrl}/documents/${record.id}`}>{record.title}</a>
                    <span className={s.rowAuthor}>
                      {record.preparedBy ?? 'Unattributed'}
                      {record.locked && <LockKeyhole size={13} aria-label="Locked" />}
                    </span>
                    <time dateTime={record.updatedAt}>{formattedDate}</time>
                    <span className={`${s.status} ${record.lifecycle === 'draft' || record.lifecycle === 'submitted' ? s.draft : ''}`}>{lifecycle}</span>
                    <ActionMenu label={`Actions for ${record.title}`} trigger={<MoreHorizontal size={18} />} items={recordActions(record)} />
                  </article>
                )
              }
              return (
                <article key={record.id} className={`${s.recordCard} ${successor ? s.supersededCard : ''}`}>
                  <div className={s.recordCardTop}>
                    <span className={s.recordType}>{type}</span>
                    <span className={`${s.status} ${record.lifecycle === 'draft' || record.lifecycle === 'submitted' ? s.draft : ''}`}>{lifecycle}</span>
                  </div>
                  <h2><a href={`${model.baseUrl}/documents/${record.id}`}>{record.title}</a></h2>
                  <div className={s.recordByline}>
                    {record.preparedBy ?? 'Unattributed'}
                    {record.locked && <LockKeyhole size={13} aria-label="Locked" />}
                  </div>
                  {(predecessor || successor) && (
                    <span className={s.supersessionHint}>
                      <CornerDownRight size={13} />
                      {successor ? 'A newer record is available' : 'Continues an earlier record'}
                    </span>
                  )}
                  <div className={s.recordCardBottom}>
                    <time dateTime={record.updatedAt}>{formattedDate}</time>
                    <ActionMenu label={`Actions for ${record.title}`} trigger={<MoreHorizontal size={18} />} items={recordActions(record)} />
                    <a href={`${model.baseUrl}/documents/${record.id}`} aria-label={`Read ${record.title}`}><ArrowUpRight size={19} /></a>
                  </div>
                </article>
              )
            })}
          </div>
          {!ws.results.loading && records.length === 0 && (
            <div className={s.empty}>
              <Search size={28} />
              <h2>No records found.</h2>
              <p>Try another title or choose a different collection.</p>
              <button className={s.secondaryButton} onClick={() => { ws.search.setValue(''); ws.exposure.apply('all'); ws.folders.select(null) }}>
                Clear filters
              </button>
            </div>
          )}
          <div className={s.pagination}>
            <span>
              Showing {resultCount === 0 ? 0 : 1}–{resultCount} of {resultCount} loaded
            </span>
            <div className={s.paginationControls}>
              <span>{view === 'cards' ? 'Cards' : 'Rows'} per page</span>
              <ChoiceMenu
                label={`${view === 'cards' ? 'Cards' : 'Rows'} per page`}
                value={String(pageSize)}
                onChange={(value) => ws.pageSize.setValue(Number(value))}
                choices={(view === 'cards' ? [6, 12, 24] : [25, 50, 100]).map((value) => ({ value: String(value), label: String(value) }))}
              />
              {ws.results.hasMore ? (
                <button className={s.primaryButton} onClick={() => ws.results.loadMore()} disabled={ws.results.loadingMore}>
                  Load more <ArrowRight size={15} />
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* Folder create/rename/delete dialogs driven by workspace dialog state */}
      {ws.actions.dialog && (
        <Modal
          open
          onOpenChange={(open) => { if (!open) ws.actions.setDialog(null) }}
          title={ws.actions.dialog === 'delete-folder' ? 'Delete folder' : ws.actions.dialog === 'rename-folder' ? 'Rename folder' : 'Create folder'}
          description={ws.actions.dialog === 'delete-folder' ? `Delete “${ws.folders.selected?.name ?? ''}”?` : 'Folder name'}
        >
          <form onSubmit={(e) => void submitDialog(e)} className={s.folderForm}>
            {ws.actions.dialog !== 'delete-folder' && (
              <label>
                Name
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Folder name"
                  aria-label="Folder name"
                  autoFocus
                />
              </label>
            )}
            {draftError && <p className={s.formError} role="alert">{draftError}</p>}
            <button type="submit" className={s.primaryButton}>
              {ws.actions.dialog === 'delete-folder' ? 'Delete' : ws.actions.dialog === 'rename-folder' ? 'Rename' : 'Create'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function findFolder(folders: RecordsPageModel['folders'], id: number | null): RecordsPageModel['folders'][number] | undefined {
  if (id == null) return undefined
  for (const folder of folders) {
    if (folder.id === id) return folder
    const child = findFolder(folder.children, id)
    if (child) return child
  }
  return undefined
}