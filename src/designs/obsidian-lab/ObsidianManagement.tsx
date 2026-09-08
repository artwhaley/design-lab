/**
 * Obsidian management surfaces — Obsidian-consistent presentation built from
 * the Lab contracts. The incubator's generic ObsidianManagement table was
 * NOT ported as authority (T12): each Lab management surface is distinct and
 * renders its own supplied model + workspace.
 */
import { useState } from 'react'
import {
  Check,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react'
import type {
  DepartmentsManagementPageModel,
  DepartmentsManagementWorkspace,
  InvitationsManagementPageModel,
  InvitationsManagementWorkspace,
  LabPageProps,
  PeopleManagementPageModel,
  PeopleManagementWorkspace,
  PersonManagementPageModel,
  PersonManagementWorkspace,
  RoleManagementPageModel,
  RolesManagementWorkspace,
  WorkPageModel,
  WorkWorkspace,
} from '../../contracts'
import type { ObsidianConfig } from './config'
import { ActionMenu, ChoiceMenu, Modal } from './controls'
import s from './obsidian.module.css'

type Props<TModel> = LabPageProps<TModel, ObsidianConfig>

// ---------------------------------------------------------------------------
// Work
// ---------------------------------------------------------------------------

export function ObsidianWork({ model, workspace }: Props<WorkPageModel> & { workspace: WorkWorkspace }) {
  if (!model.authorized) {
    return (
      <div className={s.workspacePage}>
        <div className={s.empty}><UserRound size={28} /><h2>No access to Work.</h2><p>This surface is only available to signed-in members.</p></div>
      </div>
    )
  }
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>REVIEW QUEUE</p>
          <h1>Work</h1>
          <p>Documents and requests waiting on you{model.domainAdmin ? ' — you are a domain admin' : ''}.</p>
        </div>
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      <section className={s.managementSurface} aria-label="Work queue">
        {workspace.entries.length === 0 ? (
          <div className={s.empty}><Check size={28} /><h2>Nothing in the queue.</h2><p>Submitted work and requests will appear here.</p></div>
        ) : (
          <div className={s.workGrid}>
            {workspace.entries.map((entry) => (
              <div className={s.workCard} key={entry.id}>
                <div className={s.workCardTop}>
                  <span className={s.status}>{entry.kind}</span>
                  {entry.folderName && <span className={s.templateChip}>{entry.folderName}</span>}
                </div>
                <h3><a href={entry.href}>{entry.title}</a></h3>
                <p>{entry.summary}</p>
                <div className={s.workCardFoot}>
                  <span className={s.treeDate}>{entry.requestedAtLabel}</span>
                  <ActionMenu
                    label={`Actions for ${entry.title}`}
                    trigger={<MoreHorizontal size={18} />}
                    items={entry.actions
                      .filter((action) => action.state !== 'absent')
                      .map((action) => ({ key: action.key, label: action.label, danger: action.kind === 'destructive' }))}
                    onAction={(action) => {
                      if (action.key === 'approve') void workspace.approve(entry.id)
                      if (action.key === 'return' || action.key === 'deny') void workspace.returnToDraft(entry.id)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Departments management
// ---------------------------------------------------------------------------

export function ObsidianDepartmentsManagement({ model, workspace }: Props<DepartmentsManagementPageModel> & { workspace: DepartmentsManagementWorkspace }) {
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '' })
  const rows = model.departments.filter((row) => `${row.name} ${row.slug}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>DOMAIN STRUCTURE</p>
          <h1>{model.vocabulary.subdomainPlural}</h1>
          <p>Working groups and civic offices of {model.domainName}.</p>
        </div>
        {model.canCreate && (
          <button className={s.primaryButton} onClick={() => setCreateOpen(true)}><Plus size={17} /> New {model.vocabulary.subdomainSingular}</button>
        )}
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      <section className={s.managementSurface} aria-label={`${model.vocabulary.subdomainPlural} management`}>
        <div className={s.managementToolbar}>
          <label className={s.search}>
            <Search size={18} />
            <span className={s.srOnly}>Search {model.vocabulary.subdomainPlural.toLowerCase()}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${model.vocabulary.subdomainPlural.toLowerCase()}`} />
          </label>
        </div>
        <div className={s.managementTable}>
          <div className={s.managementHead}>
            <span>Name</span><span>Slug</span><span>Status</span><span className={s.srOnly}>Actions</span>
          </div>
          {rows.map((row) => (
            <div className={s.managementRow} key={row.id}>
              <strong>{row.name}</strong>
              <span>{row.slug}</span>
              <span className={row.archived ? s.managementStatus : ''}>{row.archived ? 'Archived' : 'Active'}</span>
              <ActionMenu
                label={`Actions for ${row.name}`}
                trigger={<MoreHorizontal size={18} />}
                onAction={(action) => {
                  if (action.key === 'restore') void workspace.restoreDepartment(row.id)
                  if (action.key === 'archive') void workspace.archiveDepartment(row.id)
                }}
                items={[
                  ...(row.canRestore ? [{ key: 'restore', label: 'Restore' }] : []),
                  ...(row.canArchive ? [{ key: 'archive', label: 'Archive', danger: true }] : []),
                ]}
              />
            </div>
          ))}
        </div>
        {rows.length === 0 && <p className={s.managementEmpty}>No {model.vocabulary.subdomainPlural.toLowerCase()} match.</p>}
      </section>
      {createOpen && (
        <Modal open onOpenChange={(open) => { if (!open) setCreateOpen(false) }} title={`New ${model.vocabulary.subdomainSingular}`} description="Name and description are used across the domain.">
          <form
            className={s.folderForm}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!draft.name.trim()) return
              await workspace.createDepartment({ name: draft.name.trim(), description: draft.description.trim() })
              setCreateOpen(false)
              setDraft({ name: '', description: '' })
            }}
          >
            <label>Name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Name" autoFocus /></label>
            <label>Description<input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} aria-label="Description" /></label>
            <button type="submit" className={s.primaryButton}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Roles management
// ---------------------------------------------------------------------------

export function ObsidianRolesManagement({ model, workspace }: Props<RoleManagementPageModel> & { workspace: RolesManagementWorkspace }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [draft, setDraft] = useState({ name: '', departmentId: model.departments[0]?.id ?? 1 })
  const [peopleQuery, setPeopleQuery] = useState('')
  const selected = model.roleRecords.find((r) => r.id === workspace.selectedRoleId) ?? null
  const holders = selected ? workspace.holdersByRole[String(selected.id)] ?? [] : []
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>PERMISSIONS &amp; HOLDERS</p>
          <h1>Roles</h1>
          <p>Roles carry folder and type permissions; people hold roles.</p>
        </div>
        {workspace.canCreate && (
          <button className={s.primaryButton} onClick={() => setCreateOpen(true)}><Plus size={17} /> New role</button>
        )}
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      <section className={s.roleLayout} aria-label="Roles management">
        <div className={s.roleList}>
          {model.departments.map((dept) => (
            <div key={dept.id} className={s.roleGroup}>
              <p className={s.eyebrow}>{dept.name}</p>
              {dept.roles.map((role) => (
                <button
                  key={role.id}
                  className={`${s.roleRow} ${workspace.selectedRoleId === role.id ? s.selectedFolder : ''}`}
                  onClick={() => workspace.selectRole(role.id)}
                >
                  {role.name}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className={s.roleInspector} aria-label="Role details">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p>{model.departments.find((d) => d.id === selected.departmentId)?.name}</p>
              <dl className={s.inspectorFacts}>
                <div><dt>Holders</dt><dd>{holders.length ? holders.map((h) => h.name).join(', ') : 'None'}</dd></div>
              </dl>
              <div className={s.peopleSearchBox}>
                <label className={s.search}>
                  <Search size={18} />
                  <span className={s.srOnly}>Search people to assign</span>
                  <input
                    value={peopleQuery}
                    onChange={(e) => { setPeopleQuery(e.target.value); workspace.setPeopleSearch(e.target.value) }}
                    placeholder="Search people to assign…"
                  />
                </label>
                {workspace.searchResults.length > 0 && (
                  <div className={s.peopleResults}>
                    {workspace.searchResults.map((person) => (
                      <button key={person.id} onClick={() => { void workspace.assignHolder(selected.id, person.id); setPeopleQuery('') }}>
                        <Plus size={14} /> {person.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={s.holderList}>
                {holders.map((holder) => (
                  <span key={holder.id} className={s.holderChip}>
                    {holder.name}
                    <button aria-label={`Unassign ${holder.name}`} onClick={() => void workspace.unassignHolder(selected.id, holder.id)}><X size={13} /></button>
                  </span>
                ))}
              </div>
              {workspace.canEdit && (
                <div className={s.inspectorActions}>
                  <ActionMenu
                    label="Role actions"
                    trigger={<><MoreHorizontal size={18} /> Role actions</>}
                    onAction={(action) => {
                      if (action.key === 'rename' && selected) { setRenameDraft(selected.name); setRenameOpen(true) }
                      if (action.key === 'delete' && selected) void workspace.deleteRole(selected.id)
                    }}
                    items={[
                      { key: 'rename', label: 'Rename' },
                      ...(workspace.canDelete ? [{ key: 'delete', label: 'Delete role', danger: true }] : []),
                    ]}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={s.inspectorEmpty}>
              <UserRound size={25} />
              <h2>Choose a role</h2>
              <p>Select a role to inspect its holders and assign people.</p>
            </div>
          )}
        </div>
      </section>
      {renameOpen && selected && (
        <Modal open onOpenChange={(open) => { if (!open) setRenameOpen(false) }} title="Rename role" description={selected.name}>
          <form
            className={s.folderForm}
            onSubmit={(e) => {
              e.preventDefault()
              if (renameDraft.trim()) { void workspace.renameRole(selected.id, renameDraft.trim()); setRenameOpen(false) }
            }}
          >
            <label>Name<input value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} aria-label="Role name" autoFocus /></label>
            <button type="submit" className={s.primaryButton}>Rename</button>
          </form>
        </Modal>
      )}
      {createOpen && (
        <Modal open onOpenChange={(open) => { if (!open) setCreateOpen(false) }} title="New role" description="Roles live under a department.">
          <form
            className={s.folderForm}
            onSubmit={async (e) => {
              e.preventDefault()
              if (!draft.name.trim()) return
              await workspace.createRole({ name: draft.name.trim(), departmentId: draft.departmentId })
              setCreateOpen(false)
              setDraft({ name: '', departmentId: model.departments[0]?.id ?? 1 })
            }}
          >
            <label>Name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Role name" autoFocus /></label>
            <label>
              Department
              <select value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: Number(e.target.value) })}>
                {model.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <button type="submit" className={s.primaryButton}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// People management
// ---------------------------------------------------------------------------

export function ObsidianPeopleManagement({ model, workspace }: Props<PeopleManagementPageModel> & { workspace: PeopleManagementWorkspace }) {
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>DIRECTORY ADMIN</p>
          <h1>People</h1>
          <p>Find a person to manage their roles and access.</p>
        </div>
      </header>
      <section className={s.managementSurface} aria-label="People search">
        {model.canOpenPeople ? (
          <>
            <div className={s.managementToolbar}>
              <label className={s.search}>
                <Search size={18} />
                <span className={s.srOnly}>Search people</span>
                <input value={workspace.query} onChange={(e) => workspace.setQuery(e.target.value)} placeholder="Name or email…" />
              </label>
            </div>
            <div className={s.peopleResultsGrid}>
              {workspace.results.map((person) => (
                <a className={s.personResult} key={person.characterId} href={person.href}>
                  <UserRound size={18} strokeWidth={1.2} />
                  <span>{person.name}</span>
                </a>
              ))}
              {workspace.query && workspace.results.length === 0 && !workspace.searching && (
                <p className={s.managementEmpty}>No people match “{workspace.query}”.</p>
              )}
            </div>
          </>
        ) : (
          <div className={s.empty}><UserRound size={28} /><h2>No access to people search.</h2><p>Only viewers with people-management permission can use this surface.</p></div>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Person management
// ---------------------------------------------------------------------------

export function ObsidianPersonManagement({ model, workspace }: Props<PersonManagementPageModel> & { workspace: PersonManagementWorkspace }) {
  const assignable = workspace.roleFilter === 'assignable'
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>PERSON WORKSPACE</p>
          <h1>{model.character.name}</h1>
          <p>{model.character.kind} · {model.character.status}</p>
        </div>
        {workspace.canManageMembers && (
          <button className={s.secondaryButton} onClick={() => workspace.setRoleFilter(assignable ? 'held' : 'assignable')}>
            <SlidersHorizontal size={15} /> {assignable ? 'Show held roles' : 'Show assignable roles'}
          </button>
        )}
      </header>
      {model.controller && <p className={s.managementStatus}>Controlled by {model.controller.name ?? model.controller.email}</p>}
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      <section className={s.managementSurface} aria-label="Role access">
        <div className={s.managementTable}>
          <div className={s.managementHead}><span>Role</span><span>Department</span><span className={s.srOnly}>Actions</span></div>
          {model.roleDepartments.flatMap((dept) => dept.roles).map((role) => (
            <div className={s.managementRow} key={role.id}>
              <strong>{role.name}</strong>
              <span>{model.roleDepartments.find((d) => d.roles.some((r) => r.id === role.id))?.name ?? '—'}</span>
              <ActionMenu
                label={`Actions for ${role.name}`}
                trigger={<MoreHorizontal size={18} />}
                onAction={(action) => {
                  if (action.key === 'unassign') void workspace.unassignRole(role.id)
                  if (action.key === 'assign') void workspace.assignRole(role.id)
                }}
                items={
                  assignable
                    ? [{ key: 'assign', label: 'Assign' }]
                    : workspace.canManageMembers ? [{ key: 'unassign', label: 'Unassign', danger: true }] : []
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invitations management
// ---------------------------------------------------------------------------

export function ObsidianInvitationsManagement({ model, workspace }: Props<InvitationsManagementPageModel> & { workspace: InvitationsManagementWorkspace }) {
  const [purpose, setPurpose] = useState('join')
  const [target, setTarget] = useState('')
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>ACCESS CONTROL</p>
          <h1>Invitations</h1>
          <p>Invite people to join the domain or claim a character.</p>
        </div>
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      {model.canManage && (
        <form
          className={s.inviteForm}
          onSubmit={(e) => {
            e.preventDefault()
            if (!target.trim()) return
            void workspace.createInvitation({ purpose, targetLabel: target.trim() })
            setTarget('')
          }}
        >
          <ChoiceMenu
            label="Invitation purpose"
            value={purpose}
            onChange={setPurpose}
            choices={[
              { value: 'join', label: 'Join' },
              { value: 'claim', label: 'Claim character' },
            ]}
          />
          <label className={s.search}>
            <Search size={18} />
            <span className={s.srOnly}>Target</span>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={purpose === 'join' ? 'Email address' : 'Character name'} />
          </label>
          <button type="submit" className={s.primaryButton}><Plus size={16} /> Send invitation</button>
        </form>
      )}
      <section className={s.managementSurface} aria-label="Invitations">
        <div className={s.managementTable}>
          <div className={s.managementHead}><span>Purpose</span><span>Target</span><span>Status</span><span className={s.srOnly}>Actions</span></div>
          {workspace.invitations.map((inv) => (
            <div className={s.managementRow} key={inv.id}>
              <strong>{inv.purpose}</strong>
              <span>{inv.targetLabel}</span>
              <span className={s.managementStatus}>{inv.statusLabel}</span>
              <ActionMenu
                label={`Actions for ${inv.targetLabel}`}
                trigger={<MoreHorizontal size={18} />}
                onAction={(action) => { if (action.key === 'revoke') void workspace.revokeInvitation(inv.id) }}
                items={inv.canRevoke ? [{ key: 'revoke', label: 'Revoke', danger: true }] : []}
              />
            </div>
          ))}
        </div>
        <div className={s.requestColumns}>
          <div className={s.requestColumn}>
            <p className={s.eyebrow}>PENDING JOINS</p>
            {workspace.pendingJoins.length === 0 ? <p className={s.managementEmpty}>None.</p> : workspace.pendingJoins.map((join) => (
              <div className={s.requestRow} key={join.id}>
                <span>{join.applicantLabel} → {join.characterLabel}</span>
                <ActionMenu
                  label={`Actions for ${join.applicantLabel}`}
                  trigger={<MoreHorizontal size={16} />}
                  onAction={(action) => {
                    if (action.key === 'approve') void workspace.approveJoin(join.id)
                    if (action.key === 'deny') void workspace.denyJoin(join.id)
                  }}
                  items={[{ key: 'approve', label: 'Approve' }, { key: 'deny', label: 'Deny', danger: true }]}
                />
              </div>
            ))}
          </div>
          <div className={s.requestColumn}>
            <p className={s.eyebrow}>PENDING CLAIMS</p>
            {workspace.pendingClaims.length === 0 ? <p className={s.managementEmpty}>None.</p> : workspace.pendingClaims.map((claim) => (
              <div className={s.requestRow} key={claim.id}>
                <span>{claim.characterLabel} ← {claim.claimantLabel}</span>
                <ActionMenu
                  label={`Actions for ${claim.claimantLabel}`}
                  trigger={<MoreHorizontal size={16} />}
                  onAction={(action) => {
                    if (action.key === 'approve') void workspace.approveClaim(claim.id)
                    if (action.key === 'deny') void workspace.denyClaim(claim.id)
                  }}
                  items={[{ key: 'approve', label: 'Approve' }, { key: 'deny', label: 'Deny', danger: true }]}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}