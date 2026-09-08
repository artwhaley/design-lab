/**
 * Contract Probe — management surfaces. Work, Departments, Folders, Roles,
 * Document Types, People, Person, Invitations. Every workspace operation the
 * contract exposes is wired to a plain control so conformance testing can
 * drive them end to end.
 */
import { useState } from 'react'
import type {
  DepartmentsManagementPageModel,
  DepartmentsManagementWorkspace,
  DocumentTypesManagementPageModel,
  DocumentTypesManagementWorkspace,
  FolderManagementPageModel,
  FoldersManagementWorkspace,
  InvitationsManagementPageModel,
  InvitationsManagementWorkspace,
  PeopleManagementPageModel,
  PeopleManagementWorkspace,
  PersonManagementPageModel,
  PersonManagementWorkspace,
  RoleManagementPageModel,
  RolesManagementWorkspace,
  WorkPageModel,
  WorkWorkspace,
} from '../../contracts'
import type { LabPageProps } from '../../contracts'
import type { ProbeConfigV1 } from './config'
import { ActionButtons, EmptyState, Field, LoadingState, Pending, Section, Tag } from './shared'

type Props<TModel> = LabPageProps<TModel, ProbeConfigV1>

// ---------------------------------------------------------------------------
// Work
// ---------------------------------------------------------------------------

export function ProbeWork({ model, workspace }: Props<WorkPageModel> & { workspace: WorkWorkspace }) {
  if (!model.authorized) {
    return <div className="probe-page"><EmptyState title="You do not have access to Work" /></div>
  }
  return (
    <div className="probe-page">
      <Section title="Work queue" hint={model.domainAdmin ? 'domain admin' : undefined}>
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.entries.length === 0 ? (
          <EmptyState title="Nothing in the queue" />
        ) : (
          <div className="probe-grid">
            {workspace.entries.map((entry) => (
              <div key={entry.id} className="probe-card">
                <Field label="Kind" value={<Tag>{entry.kind}</Tag>} />
                <Field label="Title" value={entry.title} />
                <Field label="Summary" value={entry.summary} />
                {entry.folderName ? <Field label="Folder" value={entry.folderName} /> : null}
                <Field label="Requested" value={entry.requestedAtLabel} />
                <a href={entry.href}>Open</a>
                <ActionButtons actions={entry.actions} onRun={(key) => {
                  if (key.startsWith('approve')) void workspace.approve(entry.id)
                  else void workspace.returnToDraft(entry.id)
                }} />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Departments management
// ---------------------------------------------------------------------------

export function ProbeDepartmentsManagement({ model, workspace }: Props<DepartmentsManagementPageModel> & { workspace: DepartmentsManagementWorkspace }) {
  const [showCreate, setShowCreate] = useState(false)
  return (
    <div className="probe-page">
      <Section title={`Manage ${model.vocabulary.subdomainPlural}`}>
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        {model.canCreate ? (
          <>
            <button type="button" className="probe-button probe-button-primary" onClick={() => setShowCreate((v) => !v)}>
              Create {model.vocabulary.subdomainSingular}
            </button>
            {showCreate ? (
              <form className="probe-inline-form" onSubmit={async (e) => {
                e.preventDefault()
                const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
                const description = (e.currentTarget.elements.namedItem('description') as HTMLInputElement).value.trim()
                if (name) await workspace.createDepartment({ name, description })
                setShowCreate(false)
              }}>
                <input name="name" aria-label="Department name" placeholder="Name" required />
                <input name="description" aria-label="Description" placeholder="Description" />
                <button type="submit" className="probe-button probe-button-primary">Create</button>
              </form>
            ) : null}
          </>
        ) : null}
        <table className="probe-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Archived</th><th>Actions</th></tr></thead>
          <tbody>
            {model.departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.slug}</td>
                <td>{d.archived ? 'yes' : 'no'}</td>
                <td className="probe-actions">
                  {d.canRestore ? <button type="button" className="probe-button" onClick={() => void workspace.restoreDepartment(d.id)}>Restore</button> : null}
                  {d.canArchive ? <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.archiveDepartment(d.id)}>Archive</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Folders management
// ---------------------------------------------------------------------------

export function ProbeFoldersManagement({ model, workspace }: Props<FolderManagementPageModel> & { workspace: FoldersManagementWorkspace }) {
  const [createFor, setCreateFor] = useState<number | null | 'root'>(null)
  const [renameFor, setRenameFor] = useState<number | null>(null)
  const [deleteFor, setDeleteFor] = useState<number | null>(null)
  return (
    <div className="probe-page">
      <Section title="Manage folders">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        <div className="probe-toolbar">
          <input type="search" aria-label="Search folders" placeholder="Search folders" value={workspace.search} onChange={(e) => workspace.setSearch(e.target.value)} />
          <select aria-label="Sort folders" value={workspace.sort} onChange={(e) => workspace.setSort(e.target.value as 'name' | 'created')}>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>
          {workspace.canCreateRoot ? (
            <button type="button" className="probe-button probe-button-primary" onClick={() => setCreateFor('root')}>Create root folder</button>
          ) : null}
        </div>
        {workspace.loading ? <LoadingState label="folders" /> : null}
        <ul className="probe-tree">
          {workspace.nodes.map((node) => <MgmtFolderNode key={node.id} node={node} workspace={workspace} onCreate={(id) => setCreateFor(id)} onRename={(id) => setRenameFor(id)} onDelete={(id) => setDeleteFor(id)} />)}
        </ul>

        {createFor !== null ? (
          <NameDialog title="Create folder" onSubmit={async (name) => {
            await workspace.createFolder(createFor === 'root' ? null : createFor, name)
            setCreateFor(null)
          }} onClose={() => setCreateFor(null)} />
        ) : null}
        {renameFor !== null ? (
          <NameDialog title="Rename folder" initial={workspace.nodes.find((n) => n.id === renameFor)?.name} onSubmit={async (name) => {
            await workspace.renameFolder(renameFor, name)
            setRenameFor(null)
          }} onClose={() => setRenameFor(null)} />
        ) : null}
        {deleteFor !== null ? (
          <ConfirmDialog title="Delete folder" message="Delete this folder?" onSubmit={async () => {
            await workspace.deleteFolder(deleteFor)
            setDeleteFor(null)
          }} onClose={() => setDeleteFor(null)} />
        ) : null}
      </Section>
    </div>
  )
}

function MgmtFolderNode(props: {
  node: NonNullable<FoldersManagementWorkspace['nodes'][number]>
  workspace: FoldersManagementWorkspace
  onCreate(id: number): void
  onRename(id: number): void
  onDelete(id: number): void
}) {
  const { node, workspace, onCreate, onRename, onDelete } = props
  const expanded = workspace.expandedIds.has(node.id)
  const selected = workspace.selectedId === node.id
  return (
    <li>
      <div className={selected ? 'probe-tree-row probe-tree-active' : 'probe-tree-row'}>
        {node.children.length > 0 ? (
          <button type="button" className="probe-tree-toggle" onClick={() => workspace.toggleExpanded(node.id)}>{expanded ? '▾' : '▸'}</button>
        ) : <span className="probe-tree-toggle" />}
        <button type="button" onClick={() => workspace.select(node.id)}>{node.name}</button>
        {node.systemManaged ? <Tag>system</Tag> : null}
        {node.canManage ? (
          <span className="probe-actions">
            <button type="button" className="probe-button" onClick={() => onCreate(node.id)}>＋ sub</button>
            <button type="button" className="probe-button" onClick={() => onRename(node.id)}>Rename</button>
            <button type="button" className="probe-button probe-button-danger" onClick={() => onDelete(node.id)}>Delete</button>
          </span>
        ) : null}
      </div>
      {expanded ? <ul>{node.children.map((child) => <MgmtFolderNode key={child.id} node={child} workspace={workspace} onCreate={onCreate} onRename={onRename} onDelete={onDelete} />)}</ul> : null}
    </li>
  )
}

function NameDialog(props: { title: string; initial?: string; onSubmit(name: string): Promise<void> | void; onClose(): void }) {
  return (
    <div className="probe-dialog" role="dialog" aria-label={props.title}>
      <form onSubmit={async (e) => {
        e.preventDefault()
        const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
        if (name) await props.onSubmit(name)
      }}>
        <h3>{props.title}</h3>
        <label>Name<input name="name" defaultValue={props.initial ?? ''} required /></label>
        <div className="probe-actions">
          <button type="button" className="probe-button" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="probe-button probe-button-primary">Save</button>
        </div>
      </form>
    </div>
  )
}

function ConfirmDialog(props: { title: string; message: string; onSubmit(): Promise<void> | void; onClose(): void }) {
  return (
    <div className="probe-dialog" role="dialog" aria-label={props.title}>
      <form onSubmit={async (e) => {
        e.preventDefault()
        await props.onSubmit()
      }}>
        <h3>{props.title}</h3>
        <p>{props.message}</p>
        <div className="probe-actions">
          <button type="button" className="probe-button" onClick={props.onClose}>Cancel</button>
          <button type="submit" className="probe-button probe-button-danger">Confirm</button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Roles management
// ---------------------------------------------------------------------------

export function ProbeRolesManagement({ model, workspace }: Props<RoleManagementPageModel> & { workspace: RolesManagementWorkspace }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const selected = model.roleRecords.find((r) => r.id === workspace.selectedRoleId) ?? null
  const holders = workspace.selectedRoleId != null ? workspace.holdersByRole[String(workspace.selectedRoleId)] ?? [] : []
  return (
    <div className="probe-page">
      <Section title="Manage roles">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        {workspace.canCreate ? (
          <button type="button" className="probe-button probe-button-primary" onClick={() => setCreateOpen(true)}>Create role</button>
        ) : null}
        {createOpen ? (
          <div className="probe-dialog" role="dialog" aria-label="Create role">
            <form onSubmit={async (e) => {
              e.preventDefault()
              const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
              const departmentId = Number((e.currentTarget.elements.namedItem('departmentId') as HTMLSelectElement).value)
              if (name) await workspace.createRole({ name, departmentId })
              setCreateOpen(false)
            }}>
              <h3>Create role</h3>
              <label>Name<input name="name" required /></label>
              <label>Department<select name="departmentId">{model.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <div className="probe-actions">
                <button type="button" className="probe-button" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="probe-button probe-button-primary">Create</button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="probe-grid">
          {model.departments.map((dept) => (
            <div key={dept.id} className="probe-card">
              <h4>{dept.name}</h4>
              <ul className="probe-list">
                {dept.roles.map((role) => (
                  <li key={role.id}>
                    <button type="button" className={workspace.selectedRoleId === role.id ? 'probe-link probe-link-active' : 'probe-link'} onClick={() => workspace.selectRole(role.id)}>
                      {role.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {selected ? (
          <Section title={`Role: ${selected.name}`}>
            <Field label="Department" value={model.departments.find((d) => d.id === selected.departmentId)?.name ?? '—'} />
            <Field label="Holders" value={holders.length === 0 ? 'none' : holders.map((h) => h.name).join(', ')} />
            <div className="probe-toolbar">
              <input
                type="search"
                aria-label="Search people to assign"
                placeholder="Search people…"
                value={workspace.peopleSearch}
                onChange={(e) => workspace.setPeopleSearch(e.target.value)}
              />
            </div>
            {workspace.searchingPeople ? <LoadingState label="people" /> : null}
            {workspace.searchResults.length > 0 ? (
              <ul className="probe-list">
                {workspace.searchResults.map((p) => (
                  <li key={p.id}>
                    {p.name}{' '}
                    <button type="button" className="probe-button" onClick={() => void workspace.assignHolder(selected.id, p.id)}>Assign</button>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="probe-list">
              {holders.map((h) => (
                <li key={h.id}>
                  {h.name}{' '}
                  <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.unassignHolder(selected.id, h.id)}>Unassign</button>
                </li>
              ))}
            </ul>
            {workspace.canEdit ? (
              <div className="probe-actions">
                <button type="button" className="probe-button" onClick={() => setRenameOpen(true)}>Rename</button>
                {workspace.canDelete ? (
                  <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.deleteRole(selected.id)}>Delete role</button>
                ) : null}
              </div>
            ) : null}
            {renameOpen ? (
              <NameDialog
                title="Rename role"
                initial={selected.name}
                onClose={() => setRenameOpen(false)}
                onSubmit={async (name) => { await workspace.renameRole(selected.id, name); setRenameOpen(false) }}
              />
            ) : null}
          </Section>
        ) : null}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Document Types management
// ---------------------------------------------------------------------------

export function ProbeDocumentTypesManagement({ model, workspace }: Props<DocumentTypesManagementPageModel> & { workspace: DocumentTypesManagementWorkspace }) {
  const [createFor, setCreateFor] = useState<number | null | 'root'>(null)
  return (
    <div className="probe-page">
      <Section title="Document types">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        {model.canManage ? (
          <button type="button" className="probe-button probe-button-primary" onClick={() => setCreateFor('root')}>Create type</button>
        ) : null}
        <ul className="probe-tree">
          {workspace.tree.map((node) => <TypeNode key={node.id} node={node} workspace={workspace} onCreate={(id) => setCreateFor(id)} />)}
        </ul>
        {createFor !== null ? (
          <div className="probe-dialog" role="dialog" aria-label="Create document type">
            <form onSubmit={async (e) => {
              e.preventDefault()
              const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
              const mode = (e.currentTarget.elements.namedItem('templateMode') as HTMLSelectElement).value as 'blank' | 'markdown' | 'form-to-markdown'
              if (name) await workspace.createType({ name, parentId: createFor === 'root' ? null : createFor, templateMode: mode })
              setCreateFor(null)
            }}>
              <h3>Create document type</h3>
              <label>Name<input name="name" required /></label>
              <label>Template mode<select name="templateMode"><option value="blank">Blank</option><option value="markdown">Markdown</option><option value="form-to-markdown">Form → Markdown</option></select></label>
              <div className="probe-actions">
                <button type="button" className="probe-button" onClick={() => setCreateFor(null)}>Cancel</button>
                <button type="submit" className="probe-button probe-button-primary">Create</button>
              </div>
            </form>
          </div>
        ) : null}
      </Section>
    </div>
  )
}

function TypeNode(props: {
  node: NonNullable<DocumentTypesManagementWorkspace['tree'][number]>
  workspace: DocumentTypesManagementWorkspace
  onCreate(id: number): void
}) {
  const { node, workspace, onCreate } = props
  if (node.kind === 'document-type') {
    const selected = workspace.selectedTypeId === node.id
    return (
      <li>
        <div className={selected ? 'probe-tree-row probe-tree-active' : 'probe-tree-row'}>
          <button type="button" onClick={() => workspace.select(node.id)}>{node.name}</button>
          <Tag>{node.templateMode}</Tag>
          {node.archived ? <Tag>archived</Tag> : null}
        </div>
      </li>
    )
  }
  const expanded = true
  return (
    <li>
      <div className="probe-tree-row probe-tree-folder">
        <span className="probe-tree-toggle">{expanded ? '▾' : '▸'}</span>
        <strong>{node.name}</strong>
        {node.kind !== 'unassigned' ? <button type="button" className="probe-button" onClick={() => onCreate(node.id)}>＋ type</button> : null}
      </div>
      <ul>{node.children.map((child) => <TypeNode key={child.id} node={child} workspace={workspace} onCreate={onCreate} />)}</ul>
    </li>
  )
}

// ---------------------------------------------------------------------------
// People management
// ---------------------------------------------------------------------------

export function ProbePeopleManagement({ model, workspace }: Props<PeopleManagementPageModel> & { workspace: PeopleManagementWorkspace }) {
  return (
    <div className="probe-page">
      <Section title="Find people">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        {model.canOpenPeople ? (
          <>
            <input type="search" aria-label="Search people" placeholder="Name or email…" value={workspace.query} onChange={(e) => workspace.setQuery(e.target.value)} />
            {workspace.searching ? <LoadingState label="people" /> : null}
            {workspace.results.length === 0 && workspace.query ? <EmptyState title="No matches" /> : null}
            <ul className="probe-list">
              {workspace.results.map((r) => (
                <li key={r.characterId}><a href={r.href}>{r.name}</a></li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title="No access to people search" />
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Person management
// ---------------------------------------------------------------------------

export function ProbePersonManagement({ model, workspace }: Props<PersonManagementPageModel> & { workspace: PersonManagementWorkspace }) {
  const held = model.roleDepartments.flatMap((d) => d.roles.map((r) => ({ ...r, departmentName: d.name })))
  const assignable = workspace.roleFilter === 'assignable'
  return (
    <div className="probe-page">
      <Section title={`Person: ${model.character.name}`}>
        <Field label="Kind" value={model.character.kind} />
        <Field label="Status" value={model.character.status} />
        <Field label="Controller" value={model.controller ? `${model.controller.name ?? '—'} <${model.controller.email}>` : '—'} />
        <Field label="Local display name" value={model.localDisplayName} />
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
      </Section>

      <Section title="Role access">
        <label className="probe-check">
          <input type="checkbox" checked={assignable} onChange={(e) => workspace.setRoleFilter(e.target.checked ? 'assignable' : 'held')} />
          Show assignable roles
        </label>
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        <table className="probe-table">
          <thead><tr><th>Role</th><th>Department</th><th></th></tr></thead>
          <tbody>
            {held.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.departmentName}</td>
                <td>
                  {workspace.canManageMembers ? (
                    <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.unassignRole(r.id)}>Unassign</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assignable && workspace.canManageMembers ? (
          <>
            <h4>Assignable roles</h4>
            <ul className="probe-list">
              {model.roleDepartments.flatMap((d) => d.roles.filter((r) => !held.some((h) => h.id === r.id)).map((r) => ({ ...r, departmentName: d.name }))).map((r) => (
                <li key={r.id}>
                  {r.name} · {r.departmentName}{' '}
                  <button type="button" className="probe-button" onClick={() => void workspace.assignRole(r.id)}>Assign</button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invitations management
// ---------------------------------------------------------------------------

export function ProbeInvitationsManagement({ model, workspace }: Props<InvitationsManagementPageModel> & { workspace: InvitationsManagementWorkspace }) {
  const [purpose, setPurpose] = useState('join')
  return (
    <div className="probe-page">
      <Section title="Invitations">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        <Pending pending={workspace.pending} />
        {workspace.error ? <p className="probe-error" role="alert">{workspace.error}</p> : null}
        {model.canManage ? (
          <form className="probe-inline-form" onSubmit={async (e) => {
            e.preventDefault()
            const targetLabel = (e.currentTarget.elements.namedItem('targetLabel') as HTMLInputElement).value.trim()
            if (targetLabel) await workspace.createInvitation({ purpose, targetLabel })
            e.currentTarget.reset()
          }}>
            <select aria-label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="join">Join</option>
              <option value="claim">Claim character</option>
            </select>
            <input name="targetLabel" aria-label="Target" placeholder={purpose === 'join' ? 'Email address' : 'Character name'} required />
            <button type="submit" className="probe-button probe-button-primary">Send invitation</button>
          </form>
        ) : null}
        <table className="probe-table">
          <thead><tr><th>Purpose</th><th>Target</th><th>Issued by</th><th>Expires</th><th>Use</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {workspace.invitations.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.purpose}</td>
                <td>{inv.targetLabel}</td>
                <td>{inv.issuedByLabel ?? '—'}</td>
                <td>{inv.expiresLabel}</td>
                <td>{inv.useLabel}</td>
                <td>{inv.statusLabel}</td>
                <td>
                  {inv.canRevoke ? <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.revokeInvitation(inv.id)}>Revoke</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Pending join requests">
        {workspace.pendingJoins.length === 0 ? <EmptyState title="None" /> : (
          <ul className="probe-list">
            {workspace.pendingJoins.map((j) => (
              <li key={j.id}>
                {j.applicantLabel} → {j.characterLabel}{' '}
                <button type="button" className="probe-button" onClick={() => void workspace.approveJoin(j.id)}>Approve</button>
                <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.denyJoin(j.id)}>Deny</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Pending claim requests">
        {workspace.pendingClaims.length === 0 ? <EmptyState title="None" /> : (
          <ul className="probe-list">
            {workspace.pendingClaims.map((c) => (
              <li key={c.id}>
                {c.characterLabel} ← {c.claimantLabel}{' '}
                <button type="button" className="probe-button" onClick={() => void workspace.approveClaim(c.id)}>Approve</button>
                <button type="button" className="probe-button probe-button-danger" onClick={() => void workspace.denyClaim(c.id)}>Deny</button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}