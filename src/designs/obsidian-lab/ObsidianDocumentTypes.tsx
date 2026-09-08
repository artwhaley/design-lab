/**
 * Obsidian Document Types — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianDocumentTypes.tsx),
 * adapted to the Lab DocumentTypesManagementWorkspace. The tree renders the
 * supplied DocumentTypeTreeNode forest; selection, create, duplicate,
 * archive/restore, and rename wire to the workspace's real mutations.
 */
import { useMemo, useRef, useState } from 'react'
import { Tree, type NodeRendererProps, type TreeApi } from 'react-arborist'
import { ChevronRight, Copy, FileText, Folder, MoreHorizontal, Plus, Search, ShieldCheck } from 'lucide-react'
import type { DocumentTypeTreeNode, LabPageProps, DocumentTypesManagementPageModel, DocumentTypesManagementWorkspace } from '../../contracts'
import type { ObsidianConfig } from './config'
import { ActionMenu, Modal } from './controls'
import s from './obsidian.module.css'

export type ArboristTypeNode = {
  id: string
  kind: DocumentTypeTreeNode['kind']
  name: string
  children: ArboristTypeNode[]
  template?: string
  templateName?: string
  archived?: boolean
  canManage: boolean
  departmentId?: number
}

/**
 * Arborist requires globally unique string ids, but department roots,
 * type folders, and document types carry numeric ids from independent
 * sequences (a department 1 and a document type 1 coexist). Namespace the
 * tree ids by kind so sibling subtrees never collide.
 */
function arboristId(kind: DocumentTypeTreeNode['kind'], id: number | string): string {
  return `${kind}/${id}`
}

/** Recover the workspace numeric id, but only for document-type nodes. */
function documentTypeId(arboristNodeId: string): number | null {
  const match = /^document-type\/(\d+)$/.exec(arboristNodeId)
  return match ? Number(match[1]) : null
}

const TEMPLATE_LABELS: Record<string, string> = {
  blank: 'Blank',
  markdown: 'Markdown',
  'form-to-markdown': 'Form',
}

function countTypes(nodes: ArboristTypeNode[]): number {
  return nodes.reduce((count, node) => count + (node.kind === 'document-type' ? 1 : 0) + countTypes(node.children), 0)
}

function TypeTreeRow({ node, style, dragHandle }: NodeRendererProps<ArboristTypeNode>) {
  const item = node.data
  const hasChildren = item.children.length > 0
  const isType = item.kind === 'document-type'
  return (
    <div
      className={`${s.arboristRow} ${s.typeTreeRow} ${node.isOpen ? s.treeOpen : ''} ${node.isSelected ? s.arboristSelected : ''}`}
      style={style}
      ref={dragHandle}
      onClick={(event) => node.handleClick(event)}
      onDoubleClick={() => !isType && item.kind !== 'unassigned' && node.toggle()}
    >
      <button
        className={s.treeChevron}
        onClick={(event) => { event.stopPropagation(); if (hasChildren) node.toggle() }}
        aria-label={hasChildren ? `${node.isOpen ? 'Collapse' : 'Expand'} ${item.name}` : undefined}
        aria-hidden={!hasChildren}
        tabIndex={hasChildren ? 0 : -1}
      >
        {hasChildren && <ChevronRight size={15} />}
      </button>
      {isType ? <FileText size={16} className={s.typeIcon} /> : <Folder size={16} className={s.treeFolderIcon} />}
      <span className={s.treeName}>{item.name}</span>
      {item.kind === 'department-root' && <span className={s.rootTag}>Department root</span>}
      {item.kind === 'unassigned' && <span className={s.rootTag}>Orphaned types</span>}
      {item.archived && <span className={s.systemTag}>Archived</span>}
      {isType && (
        <>
          <span className={s.templateChip}>{item.template}</span>
          <span className={s.templateName}>{item.templateName ?? 'No template yet'}</span>
        </>
      )}
    </div>
  )
}

export function ObsidianDocumentTypes({ model, workspace }: LabPageProps<DocumentTypesManagementPageModel, ObsidianConfig> & { workspace: DocumentTypesManagementWorkspace }) {
  const tree = useRef<TreeApi<ArboristTypeNode> | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ArboristTypeNode | null>(null)
  const [createFor, setCreateFor] = useState<number | null | 'root'>(null)
  const [draftName, setDraftName] = useState('')
  const [draftMode, setDraftMode] = useState<'blank' | 'markdown' | 'form-to-markdown'>('blank')
  const [draftError, setDraftError] = useState<string | null>(null)

  const nodes = useMemo<ArboristTypeNode[]>(() => {
    const convert = (nodesIn: DocumentTypesManagementWorkspace['tree']): ArboristTypeNode[] =>
      nodesIn.map((node) => {
        if (node.kind === 'document-type') {
          return {
            id: arboristId(node.kind, node.id),
            kind: node.kind,
            name: node.name,
            children: [],
            template: TEMPLATE_LABELS[node.templateMode] ?? node.templateMode,
            archived: node.archived,
            canManage: model.canManage,
          }
        }
        return {
          id: arboristId(node.kind, node.id),
          kind: node.kind,
          name: node.name,
          children: convert(node.children),
          canManage: model.canManage,
          departmentId: node.kind === 'department-root' ? node.id : undefined,
        }
      })
    return convert(workspace.tree)
  }, [workspace.tree, model.canManage])

  const visibleTypes = useMemo(() => countTypes(nodes), [nodes])
  const selectedIsType = selected?.kind === 'document-type'
  const selectedArchived = selected?.archived === true
  // Selection only ever stores document-type nodes, but recover the numeric
  // workspace id through the kind prefix rather than trusting the tree id.
  const selectedTypeId = selectedIsType && selected ? documentTypeId(selected.id) : null

  const submitCreate = async () => {
    const name = draftName.trim()
    if (name.length < 2) { setDraftError('Document type name must be at least 2 characters.'); return }
    await workspace.createType({ name, parentId: createFor === 'root' ? null : createFor, templateMode: draftMode })
    setCreateFor(null); setDraftName(''); setDraftError(null)
  }

  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>FIRST-ORDER AUTHORING</p>
          <h1>Document types</h1>
          <p>Types define a record&rsquo;s templates, lifecycle, and destination routing.</p>
        </div>
        {model.canManage && (
          <button className={s.primaryButton} onClick={() => { setCreateFor('root'); setDraftName('') }}>
            <Plus size={17} /> New document type
          </button>
        )}
      </header>
      <nav className={s.typeSubnav} aria-label="Document type navigation">
        <a aria-current="page" href="#types">Document types</a>
        <a href="#templates">Templates</a>
        <a href="#forms">Forms</a>
      </nav>
      <section className={s.typeBrowser} id="types">
        <div className={s.typeTreePane}>
          <div className={s.treeToolbar}>
            <label className={s.search}>
              <Search size={18} />
              <span className={s.srOnly}>Search document types</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search types and folders" />
            </label>
          </div>
          {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
          <div className={s.treeCanvas}>
            <Tree<ArboristTypeNode>
              ref={tree}
              data={nodes}
              idAccessor={(node) => node.id}
              childrenAccessor={(node) => node.children}
              openByDefault
              width="100%"
              height={446}
              indent={24}
              rowHeight={42}
              searchTerm={query}
              searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
              disableDrag={() => true}
              disableDrop={() => true}
              onSelect={(selectedNodes) => setSelected(selectedNodes.find((node) => node.data.kind === 'document-type')?.data ?? null)}
              onRename={({ id, name }) => {
                // Inline rename can fire for folder/department rows too —
                // only document-type rows map back to renameType.
                const typeId = documentTypeId(id)
                if (typeId != null) void workspace.renameType(typeId, name)
              }}
            >
              {TypeTreeRow}
            </Tree>
          </div>
          <div className={s.typeTreeFoot}>{visibleTypes} visible document types</div>
        </div>
        <aside className={s.typeInspector} aria-label="Document type inspector">
          {selectedIsType && selected ? (
            <>
              <div className={s.inspectorHead}>
                <span className={s.templateChip}>{selected.template}</span>
                <ActionMenu
                  label={`Actions for ${selected.name}`}
                  trigger={<MoreHorizontal size={19} />}
                  onAction={(action) => {
                    if (selectedTypeId == null) return
                    if (action.key === 'duplicate') void workspace.duplicateType(selectedTypeId)
                    if (action.key === 'archive') void workspace.archiveType(selectedTypeId)
                    if (action.key === 'restore') void workspace.restoreType(selectedTypeId)
                  }}
                  items={[
                    { key: 'duplicate', label: 'Duplicate' },
                    ...(selectedArchived
                      ? [{ key: 'restore', label: 'Restore' }]
                      : [{ key: 'archive', label: 'Archive' }]),
                  ]}
                />
              </div>
              <h2>{selected.name}</h2>
              <p>A document type ready for configuration.</p>
              <dl className={s.inspectorFacts}>
                <div><dt>Creation method</dt><dd>{selected.template} {selected.template === 'Blank' ? 'document' : 'template'}</dd></div>
                <div><dt>Attached template</dt><dd>{selected.templateName ?? 'No template yet'}</dd></div>
                <div><dt>Lifecycle</dt><dd>Draft → Submitted → Filed</dd></div>
              </dl>
              {selected.canManage && selectedTypeId != null && (
                <button className={s.secondaryButton} onClick={() => void workspace.duplicateType(selectedTypeId)}>
                  <ShieldCheck size={15} /> Configure type
                </button>
              )}
              {selectedTypeId != null && (
              <button className={s.quietButton} onClick={() => void workspace.duplicateType(selectedTypeId)}>
                <Copy size={14} /> Duplicate with independent template
              </button>
              )}
            </>
          ) : (
            <div className={s.inspectorEmpty}>
              <FileText size={25} />
              <h2>Choose a document type</h2>
              <p>Select a line in the tree to inspect its template and lifecycle configuration.</p>
            </div>
          )}
        </aside>
      </section>

      {createFor !== null && (
        <Modal
          open
          onOpenChange={(open) => { if (!open) setCreateFor(null) }}
          title="New document type"
          description={createFor === 'root' ? 'Create a top-level document type' : 'Create a document type in this folder'}
        >
          <form className={s.folderForm} onSubmit={(e) => { e.preventDefault(); void submitCreate() }}>
            <label>Name<input value={draftName} onChange={(e) => setDraftName(e.target.value)} aria-label="Document type name" autoFocus /></label>
            <label>
              Template mode
              <select value={draftMode} onChange={(e) => setDraftMode(e.target.value as typeof draftMode)}>
                <option value="blank">Blank</option>
                <option value="markdown">Markdown</option>
                <option value="form-to-markdown">Form → Markdown</option>
              </select>
            </label>
            {draftError && <p className={s.formError} role="alert">{draftError}</p>}
            <button type="submit" className={s.primaryButton}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  )
}