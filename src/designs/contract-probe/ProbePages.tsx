/**
 * Contract Probe — static Class-A pages. Each surface renders every field of
 * its Page Model, plainly labeled, so the contract is readable in the preview
 * and any missing fact is visible immediately. Typed against the real
 * production Page Models (`@/lib/page-models/*`) with production-shaped props
 * (model fields spread + `DesignVariantProps` + `DesignConfigProps`).
 */
import type { AboutPageModel } from '@/lib/page-models/info'
import type { DepartmentPageModel, DepartmentsPageModel } from '@/lib/page-models/departments'
import type { HomePageModel } from '@/lib/page-models/home'
import type { LorePageModel } from '@/lib/page-models/info'
import type { MembersPageModel } from '@/lib/page-models/members'
import type { ProbePageProps } from './probeTypes'
import { EmptyState, Field, Section, Tag } from './shared'

type Props<TModel> = ProbePageProps<TModel>

export function ProbeHome(props: Props<HomePageModel>) {
  const { domain, welcome, destinations, recentRecords, designConfig } = props
  return (
    <div className="probe-page">
      <Section title={`Welcome to ${domain.name}`} hint={designConfig.density === 'compact' ? 'compact density active' : undefined}>
        {welcome.html ? (
          <div className="probe-html" dangerouslySetInnerHTML={{ __html: welcome.html }} />
        ) : (
          <EmptyState title="No welcome content supplied" />
        )}
        {welcome.editHref ? <a href={welcome.editHref}>Edit welcome</a> : null}
      </Section>

      <Section title="Destinations">
        {destinations.length === 0 ? (
          <EmptyState title="No destinations" />
        ) : (
          <nav className="probe-grid" aria-label="Destinations">
            {destinations.map((d) => (
              <a key={d.segment} className="probe-card" href={d.href}>{d.label}</a>
            ))}
          </nav>
        )}
      </Section>

      <Section title="Recent records">
        {recentRecords.length === 0 ? (
          <EmptyState title="No recent records" />
        ) : (
          <table className="probe-table">
            <thead>
              <tr><th>Title</th><th>Type</th><th>Activity</th></tr>
            </thead>
            <tbody>
              {recentRecords.map((r) => (
                <tr key={String(r.id)}>
                  <td>{r.title}</td>
                  <td>{r.type}</td>
                  <td>{r.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

export function ProbeDepartments(props: Props<DepartmentsPageModel>) {
  const { baseUrl, domainName, departments, manageHref, vocabulary, designConfig } = props
  return (
    <div className="probe-page">
      <Section title={`${domainName} departments`} hint={`Vocabulary: ${vocabulary.subdomainSingular} / ${vocabulary.subdomainPlural}`}>
        {departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <div className="probe-grid">
            {departments.map((d) => (
              <div key={d.id} className="probe-card">
                <Field label="Name" value={d.name} />
                <Field label="Description" value={d.description} />
                <Field label="Members" value={d.memberCount} />
                <a href={`${baseUrl}/departments/${d.slug}`}>Open department</a>
              </div>
            ))}
          </div>
        )}
        {manageHref ? <p><a href={manageHref}>Manage departments</a></p> : null}
      </Section>
    </div>
  )
}

export function ProbeDepartment(props: Props<DepartmentPageModel>) {
  const { name, description, members, folderNames, manageHref, vocabulary, destinations, designConfig } = props
  return (
    <div className="probe-page">
      <Section title={name}>
        <Field label="Description" value={description} />
        <Field label={vocabulary.memberPlural} value={members.length} />
        <Field label={vocabulary.folderPlural} value={folderNames.join(', ') || '—'} />
        {manageHref ? <p><a href={manageHref}>Manage</a></p> : null}
      </Section>

      <Section title={vocabulary.memberPlural}>
        {members.length === 0 ? (
          <EmptyState title={`No ${vocabulary.memberPlural.toLowerCase()}`} />
        ) : (
          <ul className="probe-list">
            {members.map((m) => (
              <li key={m.id}>
                {m.name}
                {m.role ? <Tag>{m.role}</Tag> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Destinations">
        {destinations.map((d) => (
          <a key={d.segment} className="probe-card" href={d.href}>{d.label}</a>
        ))}
      </Section>
    </div>
  )
}

export function ProbeAbout(props: Props<AboutPageModel>) {
  const { bodyHtml, editHref, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="About">
        {bodyHtml ? (
          <div className="probe-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : (
          <EmptyState title="No about content supplied" />
        )}
        {editHref ? <p><a href={editHref}>Edit this page</a></p> : null}
      </Section>
    </div>
  )
}

export function ProbeLore(props: Props<LorePageModel>) {
  const { entries, designConfig } = props
  return (
    <div className="probe-page">
      <Section title="Lore index" hint={`${entries.length} entries`}>
        {entries.length === 0 ? (
          <EmptyState title="No lore entries" />
        ) : (
          <div className="probe-grid">
            {entries.map((entry) => (
              <div key={entry.slug} className="probe-card">
                {entry.group ? <Field label="Group" value={<Tag>{entry.group}</Tag>} /> : null}
                <Field label="Title" value={entry.title} />
                <Field label="Summary" value={entry.summary} />
                <Field label="Revision" value={entry.revisionLabel} />
                <a href={entry.href}>Read entry</a>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

export function ProbeMembers(props: Props<MembersPageModel>) {
  const { rows, status, vocabulary, designConfig } = props
  return (
    <div className="probe-page">
      <Section title={`${vocabulary.memberPlural} directory`} hint={`Vocabulary: ${vocabulary.domainSingular} / ${vocabulary.subdomainPlural} / ${vocabulary.rolePlural}`}>
        {status ? <p className="probe-status">{status.message}</p> : null}
        {rows.length === 0 ? (
          <EmptyState title={`No ${vocabulary.memberPlural.toLowerCase()} visible`} />
        ) : (
          <table className="probe-table">
            <thead>
              <tr><th>Name</th><th>Status</th><th>Departments</th><th>Roles</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.membershipId}>
                  <td>{row.name}{row.localDisplayName ? ` (${row.localDisplayName})` : null}</td>
                  <td>{row.membershipStatus}</td>
                  <td>{row.departments.join(', ') || '—'}</td>
                  <td>{row.roles.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}