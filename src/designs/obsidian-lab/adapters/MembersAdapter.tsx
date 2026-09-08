/**
 * Extension surface: the frozen source has no Members directory component.
 * This keeps the source directory/profile vocabulary while rendering only
 * supplied Lab member facts and links.
 */
import { ArrowUpRight, UserRound } from 'lucide-react'
import type { LabPageProps, MembersPageModel } from '../../../contracts'
import type { ObsidianConfig } from '../config'
import s from '../source/obsidian.module.css'

export function MembersAdapter({ model }: LabPageProps<MembersPageModel, ObsidianConfig>) {
  return (
    <div className={s.publicPage}>
      <section className={s.directoryHeading}>
        <p className={s.eyebrow}>THE PEOPLE OF THE DOMAIN</p>
        <h1>Members.</h1>
      </section>
      {model.status && <p className={s.notice}>{model.status.message}</p>}
      <section className={s.departmentGrid} aria-label="Members">
        {model.rows.length === 0 && <p className={s.loreEmpty}>No members are visible to you.</p>}
        {model.rows.map((row) => (
          <article className={s.departmentCard} key={row.characterId}>
            <span className={s.departmentIcon}>
              {row.avatarUrl ? <img src={row.avatarUrl} alt="" /> : <UserRound size={23} strokeWidth={1.2} />}
            </span>
            <span className={s.departmentCardTop}>
              <span>{row.departments.join(' · ') || 'No department listed'}</span>
            </span>
            <strong>{row.name}</strong>
            <p>{row.roles.join(' · ') || 'Member'}</p>
            {row.profileHref && (
              <a className={s.departmentFoot} href={row.profileHref}>
                View profile <ArrowUpRight size={14} />
              </a>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
