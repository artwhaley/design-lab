/**
 * Public member profile extension. The frozen source profile requires one
 * department, one role, and a supplied focus/detail fact. Lab's MemberPageModel
 * intentionally supplies plural departments/roles and recorded work instead,
 * so this adapter retains the source profile composition without inventing a
 * focus claim or collapsing multiple departments into one.
 */
import { ArrowLeft, ArrowUpRight, Building2, FileText, UserRound } from 'lucide-react'
import type { LabPageProps, MemberPageModel } from '../../../contracts'
import type { ObsidianConfig } from '../config'
import s from '../source/obsidian.module.css'

export function MemberAdapter({ model }: LabPageProps<MemberPageModel, ObsidianConfig>) {
  const { character } = model
  const displayName = character.displayName ?? character.name
  const departments = model.departments.map((department) => department.name).join(' · ')
  const roles = model.roleLabels.join(' · ')

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
            <h1>{displayName}</h1>
            <p className={s.characterProfileRole}>{roles || 'Member'}</p>
          </div>
        </div>
        <span className={s.characterProfileDepartment}>
          <Building2 size={15} /> {departments || 'No department listed'}
        </span>
      </section>
      <section className={s.characterProfileBody}>
        <aside className={s.characterProfileFacts}>
          <p className={s.eyebrow}>AT A GLANCE</p>
          <dl>
            <div><dt>Departments</dt><dd>{departments || '—'}</dd></div>
            <div><dt>Roles</dt><dd>{roles || '—'}</dd></div>
            <div><dt>Recorded work</dt><dd>{model.preparedRecords.length} prepared records</dd></div>
          </dl>
        </aside>
        <article className={s.characterProfileCopy}>
          <p className={s.eyebrow}><FileText size={14} /> RECORDED WORK</p>
          {model.preparedRecords.length === 0 ? (
            <p>No records prepared by {character.name} are visible to you.</p>
          ) : (
            model.preparedRecords.map((record) => (
              <div className={s.personDetail} key={record.id}>
                <div>
                  <strong>{record.title}</strong>
                  <span>{record.preparedAtLabel}</span>
                </div>
                <a href={record.href}>Open record <ArrowUpRight size={14} /></a>
              </div>
            ))
          )}
          <p>The archive supplies this profile's roles, departments, and recorded work.</p>
        </article>
      </section>
      {model.profileContactHref && (
        <a href={model.profileContactHref} className={s.quietLink}>
          Manage this person <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  )
}
