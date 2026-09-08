/**
 * Contract Probe — Records workspace + Document surfaces. These consume the
 * shared fake workspaces (records) and the action bridge (document) exactly
 * as production surfaces would, exercising search, folder scope, ordering,
 * load-more, dialogs, and lifecycle actions.
 */
import type { DocumentActionBridge, DocumentPageModel, RecordsPageModel, RecordsWorkspace } from '../../contracts'
import type { LabPageProps } from '../../contracts'
import type { ProbeConfigV1 } from './config'
import { ActionButtons, DebugId, EmptyState, Field, LifecycleBadge, LoadingState, Pending, Section, Tag } from './shared'

type RecordsProps = LabPageProps<RecordsPageModel, ProbeConfigV1> & { workspace: RecordsWorkspace }
type DocumentProps = LabPageProps<DocumentPageModel, ProbeConfigV1> & { actions: DocumentActionBridge }

export function ProbeRecords({ model, runtime, workspace }: RecordsProps) {
  const { search, folders, results, selection, actions, ordering, pageSize, mutations, capabilities } = workspace
  const { vocabulary } = model
  const selected = folders.selected

  return (
    <div className="probe-page">
      <Section title={`${vocabulary.documentPlural} workspace`}>
        <Field label="Total readable records" value={model.totalReadableRecordCount} />
        <Field label="Capabilities" value={`folders ${capabilities.manageFolders ? 'on' : 'off'} · act ${capabilities.actOnRecords ? 'on' : 'off'} · delete ${capabilities.deleteRecords ? 'on' : 'off'}`} />
      </Section>

      <Section title="Search">
        <input
          type="search"
          value={search.value}
          aria-label="Search records"
          onChange={(e) => search.setValue(e.target.value)}
        />
        <label className="probe-check">
          <input
            type="checkbox"
            checked={search.subfolders}
            onChange={(e) => search.setSubfolders(e.target.checked)}
          />
          Include subfolders
        </label>
        <label className="probe-check">
          <input
            type="checkbox"
            checked={search.active}
            onChange={(e) => {
              if (e.target.checked) search.setValue(search.value || ' ')
              else search.setValue('')
            }}
          />
          Search active
        </label>
        {search.loading ? <LoadingState label="search" /> : null}
        <Pending pending={mutations.pending} />
        {mutations.error ? <p className="probe-error" role="alert">{mutations.error}</p> : null}
      </Section>

      <Section title={`${vocabulary.folderPlural}`}>
        <div className="probe-toolbar">
          <button type="button" className="probe-button" onClick={() => { folders.select(null); actions.setDialog('create-folder') }}>Create folder</button>
          <button type="button" className="probe-button" disabled={!selected || selected.systemManaged} onClick={() => actions.setDialog('rename-folder')}>Rename folder</button>
          <button type="button" className="probe-button" disabled={!selected || selected.systemManaged} onClick={() => actions.setDialog('delete-folder')}>Delete folder</button>
        </div>
        <ul className="probe-tree">
          <li>
            <button
              type="button"
              className={folders.selectedId === null ? 'probe-tree-row probe-tree-active' : 'probe-tree-row'}
              onClick={() => folders.select(null)}
            >
              All folders <span className="probe-muted">({results.rootCount})</span>
            </button>
            {folders.list.map((f) => <FolderNode key={f.id} folder={f} workspace={workspace} />)}
          </li>
        </ul>
      </Section>

      <Section title={`Results (${results.total})`}>
        <div className="probe-toolbar">
          <select aria-label="Ordering" value={ordering.value} onChange={(e) => ordering.setValue(e.target.value as never)}>
            {(['newest', 'oldest', 'title'] as const).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select aria-label="Page size" value={pageSize.value} onChange={(e) => pageSize.setValue(Number(e.target.value))}>
            {[6, 12, 24, 25, 50, 100].map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>
        {results.loading ? <LoadingState label="records" /> : null}
        {results.error ? <p className="probe-error" role="alert">{results.error}</p> : null}
        {results.records.length === 0 && !results.loading ? <EmptyState title="No records match" /> : null}
        <table className="probe-table">
          <thead>
            <tr><th>Title</th><th>Folder</th><th>Type</th><th>Updated</th><th>Lifecycle</th><th>Lock</th></tr>
          </thead>
          <tbody>
            {results.records.map((r) => (
              <tr key={r.id} className={selection.recordId === r.id ? 'probe-row-active' : undefined}>
                <td>
                  <a href={`${model.baseUrl}/documents/${r.id}`} onClick={(e) => { e.preventDefault(); selection.selectRecord(r.id) }}>
                    {r.title}
                  </a>
                  <DebugId id={r.id} enabled={runtime.config.showDebugIds} />
                </td>
                <td>{r.folderId == null ? '—' : folders.byId.get(r.folderId)?.name ?? `#${r.folderId}`}</td>
                <td>{model.documentTypes.find((t) => t.id === r.documentTypeId)?.name ?? '—'}</td>
                <td>{r.updatedAt}</td>
                <td><LifecycleBadge>{r.lifecycle}</LifecycleBadge></td>
                <td>{r.locked ? '🔒' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.hasMore ? (
          <button type="button" className="probe-button" disabled={results.loadingMore} onClick={() => results.loadMore()}>
            {results.loadingMore ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </Section>

      <Section title="Selected record">
        {selection.selected ? (
          <div className="probe-card">
            <Field label="Title" value={selection.selected.title} />
            <Field label="Lifecycle" value={<LifecycleBadge>{selection.selected.lifecycle}</LifecycleBadge>} />
            <Field label="Superseded" value={selection.isSuperseded ? 'yes' : 'no'} />
            <Field label="Read" value={selection.selected.capabilities.read ? 'yes' : 'no'} />
            <Field label="Edit" value={selection.selected.capabilities.edit ? 'yes' : 'no'} />
            <Field label="Supersede" value={selection.selected.capabilities.supersede ? 'yes' : 'no'} />
            <Field label="Delete" value={selection.selected.capabilities.delete ? 'yes' : 'no'} />
            <a className="probe-button" href={`${model.baseUrl}/documents/${selection.selected.id}`}>View document</a>
          </div>
        ) : (
          <EmptyState title="No record selected" />
        )}
      </Section>

      {actions.dialog ? (
        <FolderDialog workspace={workspace} />
      ) : null}
    </div>
  )
}

function FolderNode(props: { folder: NonNullable<RecordsWorkspace['folders']['selected']>; workspace: RecordsWorkspace }) {
  const { folder, workspace } = props
  const { folders, results } = workspace
  const expanded = folders.expandedIds.has(folder.id)
  const selectedHere = folders.selectedId === folder.id
  const count = results.counts.get(folder.id) ?? 0
  return (
    <li>
      <div className={selectedHere ? 'probe-tree-row probe-tree-active' : 'probe-tree-row'}>
        {folder.children.length > 0 ? (
          <button type="button" className="probe-tree-toggle" onClick={() => folders.toggleExpanded(folder.id)}>{expanded ? '▾' : '▸'}</button>
        ) : (
          <span className="probe-tree-toggle" />
        )}
        <button type="button" onClick={() => folders.select(folder.id)}>
          {folder.name}
          {folder.systemManaged ? <span className="probe-tag">system</span> : null}
          <span className="probe-muted"> ({count})</span>
        </button>
      </div>
      {expanded ? (
        <ul>
          {folder.children.map((child) => <FolderNode key={child.id} folder={child} workspace={workspace} />)}
        </ul>
      ) : null}
    </li>
  )
}

function FolderDialog(props: { workspace: RecordsWorkspace }) {
  const { actions, mutations, folders } = props.workspace
  const dialog = actions.dialog
  if (!dialog) return null
  const isDelete = dialog === 'delete-folder'
  const isRename = dialog === 'rename-folder'
  const target = folders.selected
  const title = isDelete ? 'Delete folder' : isRename ? 'Rename folder' : 'Create folder'
  return (
    <div className="probe-dialog" role="dialog" aria-label={title}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const name = (form.elements.namedItem('name') as HTMLInputElement | null)?.value.trim()
          if (isDelete) {
            if (target) await mutations.deleteFolder(target.id)
          } else if (name) {
            if (isRename && target) await mutations.renameFolder(target.id, name)
            else await mutations.createFolder(target ? target.id : null, name)
          }
          actions.setDialog(null)
        }}
      >
        <h3>{title}</h3>
        {isDelete ? (
          <p>Delete “{target?.name}”? Its readable record count: {target?.readableRecordCount}.</p>
        ) : (
          <label>
            Name
            <input name="name" defaultValue={isRename ? target?.name ?? '' : ''} required />
          </label>
        )}
        <div className="probe-actions">
          <button type="button" className="probe-button" onClick={() => actions.setDialog(null)}>Cancel</button>
          <button type="submit" className={`probe-button${isDelete ? ' probe-button-danger' : ' probe-button-primary'}`}>
            {isDelete ? 'Delete' : isRename ? 'Rename' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ProbeDocument({ model, actions }: DocumentProps) {
  const { meta, supersession, concerns, tags, routes, capabilities, statusMessage } = model
  return (
    <div className="probe-page">
      <Section title={model.title}>
        <DebugId id={model.recordId} enabled={false} />
        <Field label="Lifecycle" value={<LifecycleBadge>{model.lifecycle}</LifecycleBadge>} />
        <Field label="Locked" value={model.locked ? 'yes' : 'no'} />
        <Field label="Superseded" value={model.isSuperseded ? 'yes' : 'no'} />
        <Field label="Prepared by" value={model.preparedByLabel} />
        {statusMessage ? <p className="probe-status">{statusMessage.code}: {statusMessage.text}</p> : null}
      </Section>

      {model.bodyHtml ? (
        <Section title="Body">
          <div className="probe-html" dangerouslySetInnerHTML={{ __html: model.bodyHtml }} />
        </Section>
      ) : (
        <EmptyState title="No body supplied" />
      )}
      {model.bodySource ? <pre className="probe-source">{model.bodySource}</pre> : null}

      {meta.length > 0 ? (
        <Section title="Meta">
          <table className="probe-table">
            <tbody>
              {meta.map((m) => (
                <tr key={m.label}><td className="probe-label">{m.label}</td><td>{m.value}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      <Section title="Supersession">
        <Field label="Superseded by" value={supersession.supersededBy ? <a href={routes.editUrl ?? '#'}>{supersession.supersededBy.title}</a> : '—'} />
        <Field label="Supersedes" value={supersession.supersedes ? supersession.supersedes.title : '—'} />
      </Section>

      <Section title="Concerns">
        {concerns.length === 0 ? <EmptyState title="No concerns" /> : (
          <ul className="probe-list">
            {concerns.map((c) => <li key={c.name}>{c.name}{c.relationshipLabel ? ` · ${c.relationshipLabel}` : ''}</li>)}
          </ul>
        )}
      </Section>

      <Section title="Tags">
        {tags.length === 0 ? <EmptyState title="No tags" /> : <p>{tags.map((t) => <Tag key={t}>{t}</Tag>)}</p>}
      </Section>

      <Section title="Capabilities" hint="What this viewer may do with this document (Bible §20)">
        <div className="probe-grid">
          {Object.entries(capabilities).map(([key, value]) => (
            <div key={key} className="probe-card"><Field label={key} value={value ? 'yes' : 'no'} /></div>
          ))}
        </div>
      </Section>

      <Section title="Actions" hint="Supplied by the bridge; absent actions are not rendered">
        <ActionButtons actions={actions.actions} onRun={async (key) => { await actions.run(key) }} />
      </Section>

      <Section title="Routes">
        <Field label="Edit" value={routes.editUrl ? <a href={routes.editUrl}>edit</a> : '—'} />
        <Field label="History" value={routes.historyUrl ? <a href={routes.historyUrl}>history</a> : '—'} />
        <Field label="Supersede" value={routes.supersedeUrl ? <a href={routes.supersedeUrl}>new version</a> : '—'} />
      </Section>
    </div>
  )
}