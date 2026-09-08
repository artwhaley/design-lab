/**
 * Contract Probe — static Class-A pages (no workspace bridge). Each surface
 * renders every field of its Page Model, plainly labeled, so the contract is
 * readable in the preview and any missing fact is visible immediately.
 */
import type {
  AboutPageModel,
  DepartmentPageModel,
  DepartmentsPageModel,
  HomePageModel,
  LorePageModel,
  MemberPageModel,
  MembersPageModel,
} from '../../contracts'
import type { LabPageProps } from '../../contracts'
import type { ProbeConfigV1 } from './config'
import { DebugId, EmptyState, Field, Section, Tag } from './shared'

type Props<TModel> = LabPageProps<TModel, ProbeConfigV1>

export function ProbeHome({ model, runtime }: Props<HomePageModel>) {
  const { domain, welcome, destinations, recentRecords } = model
  return (
    <div className="probe-page">
      <Section title={`Welcome to ${domain.name}`} hint={runtime.config.density === 'compact' ? 'compact density active' : undefined}>
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

export function ProbeDepartments({ model }: Props<DepartmentsPageModel>) {
  return (
    <div className="probe-page">
      <Section title={`${model.domainName} departments`} hint={`Vocabulary: ${model.vocabulary.subdomainSingular} / ${model.vocabulary.subdomainPlural}`}>
        {model.departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <div className="probe-grid">
            {model.departments.map((d) => (
              <div key={d.id} className="probe-card">
                <Field label="Name" value={d.name} />
                <Field label="Description" value={d.description} />
                <Field label="Members" value={d.memberCount} />
                <a href={`${model.baseUrl}/departments/${d.slug}`}>Open department</a>
              </div>
            ))}
          </div>
        )}
        {model.manageHref ? <p><a href={model.manageHref}>Manage departments</a></p> : null}
      </Section>
    </div>
  )
}

export function ProbeDepartment({ model }: Props<DepartmentPageModel>) {
  return (
    <div className="probe-page">
      <Section title={model.name}>
        <Field label="Description" value={model.description} />
        <Field label={model.vocabulary.memberPlural} value={model.members.length} />
        <Field label={model.vocabulary.folderPlural} value={model.folderNames.join(', ') || '—'} />
      </Section>

      <Section title={model.vocabulary.memberPlural}>
        {model.members.length === 0 ? (
          <EmptyState title={`No ${model.vocabulary.memberPlural.toLowerCase()}`} />
        ) : (
          <ul className="probe-list">
            {model.members.map((m) => (
              <li key={m.id}>
                {m.profileHref ? <a href={m.profileHref}>{m.name}</a> : m.name}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Destinations">
        {model.destinations.map((d) => (
          <a key={d.segment} className="probe-card" href={d.href}>{d.label}</a>
        ))}
      </Section>
    </div>
  )
}

export function ProbeAbout({ model }: Props<AboutPageModel>) {
  return (
    <div className="probe-page">
      <Section title="About">
        {model.bodyHtml ? (
          <div className="probe-html" dangerouslySetInnerHTML={{ __html: model.bodyHtml }} />
        ) : (
          <EmptyState title="No about content supplied" />
        )}
        {model.editHref ? <p><a href={model.editHref}>Edit this page</a></p> : null}
      </Section>
    </div>
  )
}

export function ProbeLore({ model }: Props<LorePageModel>) {
  return (
    <div className="probe-page">
      <Section title="Lore index" hint={`${model.entries.length} entries`}>
        {model.entries.length === 0 ? (
          <EmptyState title="No lore entries" />
        ) : (
          <div className="probe-grid">
            {model.entries.map((entry) => (
              <div key={entry.id} className="probe-card">
                <Field label="Group" value={<Tag>{entry.group}</Tag>} />
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

export function ProbeMembers({ model }: Props<MembersPageModel>) {
  return (
    <div className="probe-page">
      <Section title="Members directory">
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
        {model.rows.length === 0 ? (
          <EmptyState title="No members visible" />
        ) : (
          <table className="probe-table">
            <thead>
              <tr><th>Name</th><th>Departments</th><th>Roles</th></tr>
            </thead>
            <tbody>
              {model.rows.map((row) => (
                <tr key={row.characterId}>
                  <td>{row.profileHref ? <a href={row.profileHref}>{row.name}</a> : row.name}</td>
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

export function ProbeMember({ model }: Props<MemberPageModel>) {
  return (
    <div className="probe-page">
      <Section title={model.character.displayName ?? model.character.name}>
        <DebugId id={model.character.id} enabled={false} />
        {model.character.avatarUrl ? <img className="probe-avatar" src={model.character.avatarUrl} alt="" /> : null}
        {model.status ? <p className="probe-status">{model.status.message}</p> : null}
      </Section>

      <Section title="Departments">
        {model.departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <ul className="probe-list">
            {model.departments.map((d) => (
              <li key={d.id}><a href={d.href}>{d.name}</a></li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Roles">
        {model.roleLabels.length === 0 ? <EmptyState title="No roles" /> : <ul className="probe-list">{model.roleLabels.map((r) => <li key={r}>{r}</li>)}</ul>}
      </Section>

      <Section title="Prepared records">
        {model.preparedRecords.length === 0 ? (
          <EmptyState title="No prepared records" />
        ) : (
          <ul className="probe-list">
            {model.preparedRecords.map((r) => (
              <li key={r.id}><a href={r.href}>{r.title}</a> <span className="probe-muted">· {r.preparedAtLabel}</span></li>
            ))}
          </ul>
        )}
      </Section>

      {model.profileContactHref ? <p><a href={model.profileContactHref}>View profile contact</a></p> : null}
    </div>
  )
}