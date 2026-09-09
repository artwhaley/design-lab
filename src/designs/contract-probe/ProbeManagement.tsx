/**
 * Contract Probe — management surfaces. Work, Departments, Folders, Roles,
 * Document Types, People, Person, Invitations. Each surface renders every
 * field of its Page Model plainly. Folders uses the shared
 * `useFolderManagementWorkspace` seam (POST /api/folders, exactly as
 * production surfaces do); Work consumes the route-supplied approve/reject
 * server-action bridges. No invented workspace is passed as a prop.
 */
"use client";
import { useState } from "react";
import type { WorkPageModel } from "@/lib/page-models/management/work";
import type { DepartmentsManagementPageModel } from "@/lib/page-models/management/departments";
import type { FolderManagementPageModel, FolderManagementNode } from "@/lib/page-models/management/folders";
import type { RoleManagementPageModel } from "@/lib/page-models/management/roles";
import type { DocumentTypesManagementPageModel } from "@/lib/page-models/management/documentTypes";
import type { PeopleManagementPageModel, PersonManagementPageModel } from "@/lib/page-models/management/people";
import type { InvitationsManagementPageModel } from "@/lib/page-models/management/invitations";
import { useFolderManagementWorkspace } from "@/components/functional/folders/useFolderManagementWorkspace";
import type { ProbePageProps } from "./probeTypes";
import { EmptyState, Field, Section, Tag } from "./shared";

type Props<TModel> = ProbePageProps<TModel>

// ---------------------------------------------------------------------------
// Work
// ---------------------------------------------------------------------------

export function ProbeWork(props: Props<WorkPageModel> & {
  approveAction: (formData: FormData) => void | Promise<void>
  rejectAction: (formData: FormData) => void | Promise<void>
}) {
  const { authorized, domainAdmin, entries, status, approveAction, rejectAction } = props
  if (!authorized) {
    return <div className="probe-page"><EmptyState title="You do not have access to Work" /></div>
  }
  return (
    <div className="probe-page">
      <Section title="Work queue" hint={domainAdmin ? "domain admin" : undefined}>
        {status ? <p className="probe-status">{status.message}</p> : null}
        {entries.length === 0 ? (
          <EmptyState title="Nothing in the queue" />
        ) : (
          <div className="probe-grid">
            {entries.map((entry) => (
              <div key={entry.id} className="probe-card">
                <Field label="Kind" value={<Tag>{entry.kind}</Tag>} />
                <Field label="Title" value={entry.title} />
                <Field label="Summary" value={entry.summary} />
                {entry.folderName ? <Field label="Folder" value={entry.folderName} /> : null}
                {entry.requestedAt ? <Field label="Requested" value={entry.requestedAt} /> : null}
                {entry.href ? <a href={entry.href}>Open</a> : null}
                <div className="probe-actions">
                  <button
                    type="button"
                    className="probe-button probe-button-primary"
                    onClick={() => {
                      const form = new FormData()
                      form.set("documentId", String(entry.id))
                      void approveAction(form)
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="probe-button probe-button-danger"
                    onClick={() => {
                      const form = new FormData()
                      form.set("documentId", String(entry.id))
                      void rejectAction(form)
                    }}
                  >
                    Reject
                  </button>
                </div>
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

export function ProbeDepartmentsManagement(props: Props<DepartmentsManagementPageModel>) {
  const { departments, canCreate, status, vocabulary, designConfig } = props
  return (
    <div className="probe-page">
      <Section title={`Manage ${vocabulary.subdomainPlural}`} hint={`Can create: ${canCreate ? "yes" : "no"}`}>
        {status ? <p className="probe-status">{status.message}</p> : null}
        {departments.length === 0 ? (
          <EmptyState title={`No ${vocabulary.subdomainPlural.toLowerCase()}`} />
        ) : (
          <table className="probe-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Archived</th><th>Can archive</th><th>Can restore</th></tr></thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.slug}</td>
                  <td>{d.archived ? "yes" : "no"}</td>
                  <td>{d.canArchive ? "yes" : "no"}</td>
                  <td>{d.canRestore ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Folders management
// ---------------------------------------------------------------------------

export function ProbeFoldersManagement(props: Props<FolderManagementPageModel>) {
  const model = props
  const { status, designConfig } = props
  const ws = useFolderManagementWorkspace(model)
  const [createFor, setCreateFor] = useState<number | null | "root">(null)
  return (
    <div className="probe-page">
      <Section title="Manage folders">
        {status ? <p className="probe-status">{status.message}</p> : null}
        {ws.canManageRoot ? (
          <button type="button" className="probe-button probe-button-primary" onClick={() => setCreateFor("root")}>Create root folder</button>
        ) : null}
        <ul className="probe-tree">
          {model.nodes.map((node) => <MgmtFolderNode key={node.id} node={node} onCreate={(id) => setCreateFor(id)} onRename={() => {}} onDelete={() => {}} />)}
        </ul>
        {createFor !== null ? (
          <div className="probe-dialog" role="dialog" aria-label="Create folder">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value.trim()
                if (name) await ws.createFolder(name, createFor === "root" ? null : createFor)
                setCreateFor(null)
              }}
            >
              <h3>Create folder</h3>
              <label>Name<input name="name" required /></label>
              <div className="probe-actions">
                <button type="button" className="probe-button" onClick={() => setCreateFor(null)}>Cancel</button>
                <button type="submit" className="probe-button probe-button-primary">Save</button>
              </div>
            </form>
          </div>
        ) : null}
      </Section>
    </div>
  )
}

function MgmtFolderNode(props: { node: FolderManagementNode; onCreate(id: number): void; onRename(id: number): void; onDelete(id: number): void }) {
  const { node, onCreate } = props
  return (
    <li>
      <div className="probe-tree-row">
        <span className="probe-tree-toggle">▸</span>
        <button type="button" onClick={() => onCreate(node.id)}>{node.name}</button>
        {node.systemManaged ? <Tag>system</Tag> : null}
        {node.canManage ? <button type="button" className="probe-button">＋ sub</button> : null}
      </div>
      {node.children.length > 0 ? (
        <ul>{node.children.map((child) => <MgmtFolderNode key={child.id} node={child} onCreate={onCreate} onRename={props.onRename} onDelete={props.onDelete} />)}</ul>
      ) : null}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Roles management
// ---------------------------------------------------------------------------

export function ProbeRolesManagement(props: Props<RoleManagementPageModel>) {
  const { departments, roleRecords, holdersByRole, status, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="Manage roles">
        {status ? <p className="probe-status">{status.message}</p> : null}
        {departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <div className="probe-grid">
            {departments.map((dept) => (
              <div key={dept.id} className="probe-card">
                <h4>{dept.name}</h4>
                <ul className="probe-list">
                  {dept.roles.map((role) => (
                    <li key={role.id}>
                      {role.name}
                      <span className="probe-muted"> ({holdersByRole[String(role.id)]?.length ?? 0} holders)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <Field label="Role records" value={roleRecords.length} />
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Document Types management
// ---------------------------------------------------------------------------

export function ProbeDocumentTypesManagement(props: Props<DocumentTypesManagementPageModel>) {
  const { tree, canManage, status, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="Document types" hint={`Can manage: ${canManage ? "yes" : "no"}`}>
        {status ? <p className="probe-status">{status.message}</p> : null}
        <ul className="probe-tree">
          {tree.roots.map((node) => <TypeNode key={node.id} node={node} />)}
        </ul>
      </Section>
    </div>
  )
}

function TypeNode(props: { node: import("@/lib/documents/typeTree").TypeTreeNode }) {
  const { node } = props
  if (node.kind === "type" && node.leaf) {
    return (
      <li>
        <div className="probe-tree-row">
          <button type="button">{node.name}</button>
          <Tag>{node.leaf.templateSelection}</Tag>
          {node.leaf.active ? null : <Tag>archived</Tag>}
        </div>
      </li>
    )
  }
  return (
    <li>
      <div className="probe-tree-row probe-tree-folder">
        <span className="probe-tree-toggle">▾</span>
        <strong>{node.name}</strong>
      </div>
      <ul>{node.children.map((child) => <TypeNode key={child.id} node={child} />)}</ul>
    </li>
  )
}

// ---------------------------------------------------------------------------
// People management
// ---------------------------------------------------------------------------

export function ProbePeopleManagement(props: Props<PeopleManagementPageModel>) {
  const { canOpenPeople, status, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="Find people">
        {status ? <p className="probe-status">{status.message}</p> : null}
        {canOpenPeople ? (
          <EmptyState title="People workspace available" />
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

export function ProbePersonManagement(props: Props<PersonManagementPageModel>) {
  const { character, controller, localDisplayName, roleDepartments, typeAccess, canManageMembers, roleFilter, status, designConfig } = props
  const held = roleDepartments.flatMap((d) => d.roles.map((r) => ({ ...r, departmentName: d.name })))
  return (
    <div className="probe-page">
      <Section title={`Person: ${character.name}`}>
        <Field label="Kind" value={character.kind} />
        <Field label="Status" value={character.status} />
        <Field label="Controller" value={controller ? `${controller.name ?? "—"} <${controller.email}>` : "—"} />
        <Field label="Local display name" value={localDisplayName} />
        <Field label="Can manage members" value={canManageMembers ? "yes" : "no"} />
        <Field label="Role filter" value={roleFilter} />
        {status ? <p className="probe-status">{status.message}</p> : null}
      </Section>

      <Section title="Role access">
        {held.length === 0 ? <EmptyState title="No roles held" /> : (
          <table className="probe-table">
            <thead><tr><th>Role</th><th>Department</th></tr></thead>
            <tbody>
              {held.map((r) => (
                <tr key={r.id}><td>{r.name}</td><td>{r.departmentName}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Type access">
        {typeAccess.length === 0 ? <EmptyState title="No type access summaries" /> : (
          <table className="probe-table">
            <thead><tr><th>Type</th><th>Read</th><th>Create</th><th>Edit</th></tr></thead>
            <tbody>
              {typeAccess.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.read.allowed ? "yes" : "no"} ({t.read.source})</td>
                  <td>{t.create.allowed ? "yes" : "no"} ({t.create.source})</td>
                  <td>{t.edit.allowed ? "yes" : "no"} ({t.edit.source})</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invitations management
// ---------------------------------------------------------------------------

export function ProbeInvitationsManagement(props: Props<InvitationsManagementPageModel>) {
  const { canManage, invitations, pendingJoins, pendingClaims, status, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="Invitations" hint={`Can manage: ${canManage ? "yes" : "no"}`}>
        {status ? <p className="probe-status">{status.message}</p> : null}
        {invitations.length === 0 ? <EmptyState title="No invitations issued" /> : (
          <table className="probe-table">
            <thead><tr><th>Purpose</th><th>Target</th><th>Issued by</th><th>Expires</th><th>Use</th><th>Status</th><th>Can revoke</th></tr></thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.purpose}</td>
                  <td>{inv.targetLabel}</td>
                  <td>{inv.issuedByLabel ?? "—"}</td>
                  <td>{inv.expiresLabel}</td>
                  <td>{inv.useLabel}</td>
                  <td>{inv.statusLabel}</td>
                  <td>{inv.canRevoke ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Pending join requests">
        {pendingJoins.length === 0 ? <EmptyState title="None" /> : (
          <ul className="probe-list">
            {pendingJoins.map((j) => (
              <li key={j.id}>{j.applicantLabel} → {j.characterLabel}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Pending claim requests">
        {pendingClaims.length === 0 ? <EmptyState title="None" /> : (
          <ul className="probe-list">
            {pendingClaims.map((c) => (
              <li key={c.id}>{c.characterLabel} ← {c.claimantLabel}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}