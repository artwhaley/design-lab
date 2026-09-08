/**
 * Obsidian Folder Manager — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianFolderManager.tsx),
 * adapted to the Lab FoldersManagementWorkspace. Rename/move/new/delete wire
 * to the workspace's real mutations (renameFolder, moveFolder, createFolder,
 * deleteFolder); system-managed folders are read-only.
 */
import { useMemo, useRef, useState } from 'react'
import { Tree, type NodeRendererProps, type TreeApi } from 'react-arborist'
import { ChevronRight, Folder, FolderOpen, MoreHorizontal, Plus, Search } from 'lucide-react'
import type { LabPageProps, FolderManagementPageModel, FoldersManagementWorkspace } from '../../contracts'
import type { ObsidianConfig } from './config'
import { ActionMenu, ChoiceMenu, Modal } from './controls'
import s from './obsidian.module.css'

export type ManagedFolderNode = {
  id: string
  name: string
  createdLabel: string
  systemManaged?: boolean
  canManage: boolean
  children: ManagedFolderNode[]
}

type Sort = 'name-asc' | 'name-desc' | 'newest' | 'oldest'

function sortTree(nodes: ManagedFolderNode[], sort: Sort): ManagedFolderNode[] {
  const direction = sort === 'name-desc' || sort === 'oldest' ? -1 : 1
  const comparator = (left: ManagedFolderNode, right: ManagedFolderNode) => {
    if (sort === 'newest' || sort === 'oldest') return left.createdLabel.localeCompare(right.createdLabel) * direction
    return left.name.localeCompare(right.name) * direction
  }
  return [...nodes].sort(comparator).map((node) => ({ ...node, children: sortTree(node.children, sort) }))
}

function FolderRow({ node, style, dragHandle }: NodeRendererProps<ManagedFolderNode>) {
  const hasChildren = node.data.children.length > 0
  return (
    <div
      className={`${s.arboristRow} ${node.isOpen ? s.treeOpen : ''} ${node.isSelected ? s.arboristSelected : ''}`}
      style={style}
      ref={dragHandle}
      onClick={(event) => node.handleClick(event)}
      onDoubleClick={() => !node.data.systemManaged && node.edit()}
    >
      <button
        className={s.treeChevron}
        onClick={(event) => { event.stopPropagation(); if (hasChildren) node.toggle() }}
        aria-label={hasChildren ? `${node.isOpen ? 'Collapse' : 'Expand'} ${node.data.name}` : undefined}
        aria-hidden={!hasChildren}
        tabIndex={hasChildren ? 0 : -1}
      >
        {hasChildren && <ChevronRight size={15} />}
      </button>
      {node.isOpen && hasChildren ? <FolderOpen size={17} className={s.treeFolderIcon} /> : <Folder size={17} className={s.treeFolderIcon} />}
      {node.isEditing ? (
        <input
          className={s.treeRename}
          defaultValue={node.data.name}
          aria-label={`Rename ${node.data.name}`}
          autoFocus
          onBlur={(event) => node.submit(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') node.submit(event.currentTarget.value)
            if (event.key === 'Escape') node.reset()
          }}
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <span className={s.treeName}>{node.data.name}</span>
      )}
      {node.data.systemManaged && <span className={s.systemTag}>System</span>}
      <span className={s.treeDate}>{node.data.createdLabel}</span>
    </div>
  )
}

export function ObsidianFolderManager({ workspace }: LabPageProps<FolderManagementPageModel, ObsidianConfig> & { workspace: FoldersManagementWorkspace }) {
  const tree = useRef<TreeApi<ManagedFolderNode> | null>(null)
  const [sort, setSort] = useState<Sort>('name-asc')
  const [selected, setSelected] = useState<ManagedFolderNode | null>(null)
  const [newFor, setNewFor] = useState<number | null | 'root'>(null)
  const [draftName, setDraftName] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)

  const nodes = useMemo<ManagedFolderNode[]>(() => {
    const convert = (nodesIn: FoldersManagementWorkspace['nodes']): ManagedFolderNode[] =>
      nodesIn.map((node) => ({
        id: String(node.id),
        name: node.name,
        createdLabel: new Date(node.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        systemManaged: node.systemManaged,
        canManage: node.canManage,
        children: convert(node.children),
      }))
    return sortTree(convert(workspace.nodes), sort)
  }, [workspace.nodes, sort])

  const submitNew = async () => {
    const name = draftName.trim()
    if (name.length < 2) { setDraftError('Folder name must be at least 2 characters.'); return }
    await workspace.createFolder(newFor === 'root' ? null : newFor, name)
    setNewFor(null); setDraftName(''); setDraftError(null)
  }

  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>RECORDS ORGANIZATION</p>
          <h1>Folders</h1>
          <p>Arrange the archive without changing the permissions carried by document types.</p>
        </div>
        {workspace.canCreateRoot && (
          <button className={s.primaryButton} onClick={() => { setNewFor('root'); setDraftName('') }}>
            <Plus size={17} /> New folder
          </button>
        )}
      </header>
      <section className={s.treeManager} aria-label="Folder manager">
        <div className={s.treeToolbar}>
          <label className={s.search}>
            <Search size={18} />
            <span className={s.srOnly}>Search folders</span>
            <input value={workspace.search} onChange={(event) => workspace.setSearch(event.target.value)} placeholder="Search folders" />
          </label>
          <ChoiceMenu
            label="Sort folders"
            value={sort}
            onChange={(value) => setSort(value as Sort)}
            choices={[
              { value: 'name-asc', label: 'Name A–Z' },
              { value: 'name-desc', label: 'Name Z–A' },
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
            ]}
          />
        </div>
        {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
        <div className={s.treeCanvas}>
          <Tree<ManagedFolderNode>
            ref={tree}
            data={nodes}
            idAccessor={(node) => node.id}
            childrenAccessor={(node) => node.children}
            openByDefault
            width="100%"
            height={470}
            indent={24}
            rowHeight={42}
            overscanCount={5}
            searchTerm={workspace.search}
            searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
            disableDrag={(node) => node.systemManaged || !node.canManage}
            disableDrop={({ parentNode }) => !parentNode || Boolean(parentNode.data.systemManaged) || !parentNode.data.canManage}
            onSelect={(nodesIn) => setSelected(nodesIn[0]?.data ?? null)}
            onMove={({ parentId, dragIds }) => {
              const moved = dragIds[0]
              if (moved != null) void workspace.moveFolder(Number(moved), parentId === null ? null : Number(parentId))
            }}
            onRename={({ id, name }) => void workspace.renameFolder(Number(id), name)}
          >
            {FolderRow}
          </Tree>
        </div>
        <div className={s.treeFooter}>
          <span>{selected ? `Selected: ${selected.name}` : 'Select a folder to inspect or manage it.'}</span>
          <ActionMenu
            label="Folder actions"
            trigger={<><MoreHorizontal size={18} /> Folder actions</>}
            onAction={(action) => {
              if (action.key === 'new-child' && selected) { setNewFor(Number(selected.id)); setDraftName('') }
              if (action.key === 'rename' && selected) tree.current?.get(selected.id)?.edit()
              if (action.key === 'delete' && selected) void workspace.deleteFolder(Number(selected.id))
            }}
            items={[
              { key: 'new-child', label: 'New subfolder' },
              { key: 'rename', label: 'Rename' },
              { key: 'delete', label: 'Delete folder', danger: true },
            ]}
          />
        </div>
      </section>

      {newFor !== null && (
        <Modal
          open
          onOpenChange={(open) => { if (!open) setNewFor(null) }}
          title="New folder"
          description={newFor === 'root' ? 'Create a root folder' : 'Create a subfolder'}
        >
          <form className={s.folderForm} onSubmit={(e) => { e.preventDefault(); void submitNew() }}>
            <label>Name<input value={draftName} onChange={(e) => setDraftName(e.target.value)} aria-label="Folder name" autoFocus /></label>
            {draftError && <p className={s.formError} role="alert">{draftError}</p>}
            <button type="submit" className={s.primaryButton}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  )
}