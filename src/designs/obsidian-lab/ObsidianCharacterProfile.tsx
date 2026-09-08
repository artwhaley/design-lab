/**
 * Obsidian Character Profile + Members directory — rebuilt from the Lab
 * MemberPageModel / MembersPageModel. The incubation version consumed an
 * org-chart member + department; the Lab member surface supplies character
 * identity, departments, role labels, prepared records, and an optional
 * profile contact link. All facts are model-supplied; no invented biography.
 */
import { ArrowLeft, ArrowUpRight, FileText, UserRound } from 'lucide-react'
import type { LabPageProps, MemberPageModel, MembersPageModel } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

/** Members directory — renders the supplied rows; no invented avatars. */
export function ObsidianMembers({ model }: LabPageProps<MembersPageModel, ObsidianConfig>) {
  return (
    <div className={s.publicPage}>
      <section className={s.directoryHeading}>
        <p className={s.eyebrow}>THE PEOPLE OF THE DOMAIN</p>
        <h1>Members.</h1>
      </section>
      {model.status && <p className={s.notice}>{model.status.message}</p>}
      <section className={s.memberGrid} aria-label="Members">
        {model.rows.length === 0 && <p className={s.managementEmpty}>No members are visible to you.</p>}
        {model.rows.map((row) => (
          <div className={s.memberCard} key={row.characterId}>
            <span className={s.memberCardMark}>
              {row.avatarUrl ? <img src={row.avatarUrl} alt="" /> : <UserRound size={18} strokeWidth={1.2} />}
            </span>
            <div>
              <strong>{row.name}</strong>
              <span className={s.memberMeta}>{row.roles.join(' · ') || row.departments.join(' · ') || 'Member'}</span>
              {row.profileHref && <a href={row.profileHref}>View profile <ArrowUpRight size={14} /></a>}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export function ObsidianCharacterProfile({ model }: LabPageProps<MemberPageModel, ObsidianConfig>) {
  const { character } = model
  return (
    <div className={s.publicPage}>
      <a href={`${model.baseUrl}/members`} className={s.backLink}>
        <ArrowLeft size={15} /> All members
      </a>
      <section className={s.characterProfileHero}>
        <div className={s.characterProfileIdentity}>
          <span className={s.characterProfileMark} aria-hidden="true">
            {character.avatarUrl ? <img src={character.avatarUrl} alt="" /> : <UserRound size={31} strokeWidth={1.1} />}
          </span>
          <div>
            <p className={s.eyebrow}>CHARACTER PROFILE</p>
            <h1>{character.displayName ?? character.name}</h1>
            <p className={s.characterProfileRole}>{model.roleLabels.join(' · ') || 'Member'}</p>
          </div>
        </div>
      </section>
      <section className={s.characterProfileBody}>
        <aside className={s.characterProfileFacts}>
          <p className={s.eyebrow}>AT A GLANCE</p>
          <dl>
            <div><dt>Departments</dt><dd>{model.departments.length ? model.departments.map((d) => d.name).join(', ') : '—'}</dd></div>
            <div><dt>Roles</dt><dd>{model.roleLabels.join(', ') || '—'}</dd></div>
            <div><dt>Recorded work</dt><dd>{model.preparedRecords.length} prepared records</dd></div>
          </dl>
        </aside>
        <article className={s.characterProfileCopy}>
          <p className={s.eyebrow}><FileText size={14} /> RECORDED WORK</p>
          {model.preparedRecords.length === 0 ? (
            <p>No records prepared by {character.name} are visible to you.</p>
          ) : (
            <ul className={s.profileRecordList}>
              {model.preparedRecords.map((record) => (
                <li key={record.id}>
                  <a href={record.href}>{record.title}<ArrowUpRight size={15} /></a>
                  <span>{record.preparedAtLabel}</span>
                </li>
              ))}
            </ul>
          )}
          <p className={s.characterProfileNote}>
            This profile is the public-facing place for a character&rsquo;s roles, departments, and recorded work.
          </p>
        </article>
      </section>
      {model.profileContactHref && (
        <a href={model.profileContactHref} className={s.quietLink}>Manage this person <ArrowUpRight size={14} /></a>
      )}
    </div>
  )
}

