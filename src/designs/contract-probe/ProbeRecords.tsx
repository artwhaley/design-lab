/**
 * Contract Probe — Records workspace + Document surfaces. Records consumes the
 * shared `useRecordsWorkspace` behavior exactly as production surfaces do
 * (search, folder scope, load-more, selection); Document receives the real
 * server-action bridge props (`workflowAction`/`deleteAction`) the route
 * hands to every Design. No invented mutation surface: folder management is
 * reached through the management route, matching production's Records seam.
 */
"use client";
import type { RecordsPageModel } from "@/lib/page-models/records";
import type { FolderSummary } from "@/lib/page-models/common";
import type { DocumentPageModel } from "@/lib/page-models/document";
import { useRecordsWorkspace } from "@/lib/records/workspace/useRecordsWorkspace";
import type { ProbeConfigV1 } from "./config";
import { DebugId, EmptyState, Field, LifecycleBadge, LoadingState, Section, Tag } from "./shared";
import type { ProbeAction } from "./shared";

type RecordsProps = RecordsPageModel & { designConfig: ProbeConfigV1 }
type DocumentProps = DocumentPageModel & {
  designConfig: ProbeConfigV1
  headerLayout: string
  documentStyle: string
  workflowAction?: ((formData: FormData) => void | Promise<void>) | null
  deleteAction?: ((formData: FormData) => void | Promise<void>) | null
}

export function ProbeRecords(props: RecordsProps) {
  const model = props
  const { designConfig } = props
  const core = useRecordsWorkspace(model, { pageSize: 12, sort: "-updatedAt" })
  const { search, folders, results, selection, capabilities } = core
  const { vocabulary } = model

  return (
    <div className="probe-page">
      <Section title={`${vocabulary.documentPlural} workspace`}>
        <Field label="Total readable records" value={model.totalReadableRecordCount} />
        <Field label="Capabilities" value={`folders ${capabilities.manageFolders ? "on" : "off"} · act ${capabilities.actOnRecords ? "on" : "off"} · delete ${capabilities.deleteRecords ? "on" : "off"}`} />
        <p>
          <a className="probe-button" href={`${model.baseUrl}/manage/folders`}>Create folder</a>
        </p>
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
        {search.loading ? <LoadingState label="search" /> : null}
      </Section>

      <Section title={vocabulary.folderPlural}>
        <ul className="probe-tree">
          <li>
            <button
              type="button"
              className={folders.selectedId === null ? "probe-tree-row probe-tree-active" : "probe-tree-row"}
              onClick={() => folders.select(null)}
            >
              All {vocabulary.folderPlural.toLowerCase()} <span className="probe-muted">({results.rootCount})</span>
            </button>
          </li>
          {folders.list.map((f) => <FolderNode key={f.id} folder={f} core={core} />)}
        </ul>
      </Section>

      <Section title={`Results (${results.total})`}>
        {search.loading ? <LoadingState label="records" /> : null}
        {results.records.length === 0 && !search.loading ? <EmptyState title="No records match" /> : null}
        <table className="probe-table">
          <thead>
            <tr><th>Title</th><th>Folder</th><th>Type</th><th>Updated</th><th>Lifecycle</th><th>Lock</th></tr>
          </thead>
          <tbody>
            {results.records.map((r) => (
              <tr key={r.id} className={selection.recordId === r.id ? "probe-row-active" : undefined}>
                <td>
                  <a href={`${model.baseUrl}/documents/${r.id}`} onClick={(e) => { e.preventDefault(); selection.selectRecord(r.id) }}>
                    {r.title}
                  </a>
                  <DebugId id={r.id} enabled={designConfig.showDebugIds} />
                </td>
                <td>{r.folderId == null ? "—" : folders.byId.get(r.folderId)?.name ?? `#${r.folderId}`}</td>
                <td>{model.documentTypes.find((t) => t.id === r.documentTypeId)?.name ?? "—"}</td>
                <td>{r.updatedAt}</td>
                <td><LifecycleBadge>{r.lifecycle}</LifecycleBadge></td>
                <td>{r.locked ? "🔒" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.hasMore ? (
          <button type="button" className="probe-button" disabled={results.loadingMore} onClick={() => void results.loadMore()}>
            {results.loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </Section>

      <Section title="Selected record">
        {selection.selected ? (
          <div className="probe-card">
            <Field label="Title" value={selection.selected.title} />
            <Field label="Lifecycle" value={<LifecycleBadge>{selection.selected.lifecycle}</LifecycleBadge>} />
            <Field label="Superseded" value={selection.isSuperseded ? "yes" : "no"} />
            <Field label="Read" value={selection.selected.capabilities.read ? "yes" : "no"} />
            <Field label="Edit" value={selection.selected.capabilities.edit ? "yes" : "no"} />
            <Field label="Supersede" value={selection.selected.capabilities.supersede ? "yes" : "no"} />
            <Field label="Delete" value={selection.selected.capabilities.delete ? "yes" : "no"} />
            <a className="probe-button" href={`${model.baseUrl}/documents/${selection.selected.id}`}>View document</a>
          </div>
        ) : (
          <EmptyState title="No record selected" />
        )}
      </Section>
    </div>
  )
}

function FolderNode(props: { folder: FolderSummary; core: ReturnType<typeof useRecordsWorkspace> }) {
  const { folder, core } = props
  const { folders, results } = core
  const expanded = folders.expandedIds.has(folder.id)
  const selectedHere = folders.selectedId === folder.id
  const count = results.counts.get(folder.id) ?? 0
  return (
    <li>
      <div className={selectedHere ? "probe-tree-row probe-tree-active" : "probe-tree-row"}>
        {folder.children.length > 0 ? (
          <button type="button" className="probe-tree-toggle" onClick={() => folders.toggleExpanded(folder.id)}>{expanded ? "▾" : "▸"}</button>
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
          {folder.children.map((child) => <FolderNode key={child.id} folder={child} core={core} />)}
        </ul>
      ) : null}
    </li>
  )
}

export function ProbeDocument(props: DocumentProps) {
  const { title, recordId, lifecycle, locked, isSuperseded, preparedByLabel, statusMessage, bodyHtml, bodySource, meta, supersession, concerns, tags, capabilities, routes, workflowAction, deleteAction } = props
  const actions: ProbeAction[] = [
    ...(workflowAction ? [
      { key: "submit", label: "Submit for approval", state: "available" as const, kind: "primary" as const },
    ] : []),
    ...(deleteAction ? [
      { key: "delete", label: "Delete document", state: "available" as const, kind: "destructive" as const },
    ] : []),
  ]
  return (
    <div className="probe-page">
      <Section title={title}>
        <DebugId id={recordId} enabled={false} />
        <Field label="Lifecycle" value={<LifecycleBadge>{lifecycle}</LifecycleBadge>} />
        <Field label="Locked" value={locked ? "yes" : "no"} />
        <Field label="Superseded" value={isSuperseded ? "yes" : "no"} />
        <Field label="Prepared by" value={preparedByLabel} />
        {statusMessage ? <p className="probe-status">{statusMessage.code}: {statusMessage.text}</p> : null}
      </Section>

      {bodyHtml ? (
        <Section title="Body">
          <div className="probe-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </Section>
      ) : (
        <EmptyState title="No body supplied" />
      )}
      {bodySource ? <pre className="probe-source">{bodySource}</pre> : null}

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
        <Field label="Superseded by" value={supersession.supersededBy ? <a href={routes.editUrl ?? "#"}>{supersession.supersededBy.title}</a> : "—"} />
        <Field label="Supersedes" value={supersession.supersedes ? supersession.supersedes.title : "—"} />
      </Section>

      <Section title="Concerns">
        {concerns.length === 0 ? <EmptyState title="No concerns" /> : (
          <ul className="probe-list">
            {concerns.map((c) => <li key={c.name}>{c.name}{c.relationshipLabel ? ` · ${c.relationshipLabel}` : ""}</li>)}
          </ul>
        )}
      </Section>

      <Section title="Tags">
        {tags.length === 0 ? <EmptyState title="No tags" /> : <p>{tags.map((t) => <Tag key={t}>{t}</Tag>)}</p>}
      </Section>

      <Section title="Capabilities" hint="What this viewer may do with this document (Bible §20)">
        <div className="probe-grid">
          {Object.entries(capabilities).map(([key, value]) => (
            <div key={key} className="probe-card"><Field label={key} value={value ? "yes" : "no"} /></div>
          ))}
        </div>
      </Section>

      <Section title="Actions" hint="Supplied by the route; absent actions are not rendered">
        {actions.length === 0 ? (
          <EmptyState title="No actions available" />
        ) : (
          <div className="probe-actions">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={`probe-button${action.kind === "primary" ? " probe-button-primary" : action.kind === "destructive" ? " probe-button-danger" : ""}`}
                onClick={() => {
                  const form = new FormData()
                  form.set("documentId", String(recordId))
                  if (action.key === "submit" && workflowAction) void workflowAction(form)
                  if (action.key === "delete" && deleteAction) void deleteAction(form)
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="Routes">
        <Field label="Edit" value={routes.editUrl ? <a href={routes.editUrl}>edit</a> : "—"} />
        <Field label="History" value={routes.historyUrl ? <a href={routes.historyUrl}>history</a> : "—"} />
        <Field label="Supersede" value={routes.supersedeUrl ? <a href={routes.supersedeUrl}>new version</a> : "—"} />
      </Section>
    </div>
  )
}
