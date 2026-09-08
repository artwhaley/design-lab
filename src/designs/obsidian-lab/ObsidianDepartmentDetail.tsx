/**
 * Obsidian Department Detail — rebuilt from the Lab DepartmentPageModel.
 * The incubation version rendered a Syncfusion org-chart diagram; the Lab
 * contract supplies only a flat member list (no org hierarchy), so Syncfusion
 * stays out per the T12 dependency policy. The presentation keeps the
 * Obsidian directory styling and renders the supplied members as cards with
 * their profile links. Org-chart hierarchy is recorded as pressure.
 */
import { ArrowLeft, ArrowUpRight, Folder, UsersRound } from 'lucide-react'
import type { DepartmentPageModel, LabPageProps } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

export function ObsidianDepartmentDetail({ model }: LabPageProps<DepartmentPageModel, ObsidianConfig>) {
  return (
    <div className={s.publicPage}>
      <a href={`${model.baseUrl}/departments`} className={s.backLink}>
        <ArrowLeft size={15} /> All departments
      </a>
      <section className={s.departmentDetailHeading}>
        <div>
          <p className={s.eyebrow}>DEPARTMENT DIRECTORY</p>
          <h1>{model.name}</h1>
          <p>{model.description ?? 'A working group of the domain.'}</p>
        </div>
        <span><UsersRound size={16} /> {model.members.length} {model.vocabulary.memberPlural.toLowerCase()}</span>
      </section>
      <section className={s.orgChartPanel} aria-label={`${model.name} members`}>
        <div className={s.orgChartHeading}>
          <div>
            <p className={s.eyebrow}>AT A GLANCE</p>
            <h2>{model.vocabulary.memberPlural}</h2>
          </div>
          <span><Folder size={15} /> {model.vocabulary.folderPlural}: {model.folderNames.join(', ') || 'none'}</span>
        </div>
        <div className={s.memberCards}>
          {model.members.length === 0 && <p className={s.managementEmpty}>No active members in this {model.vocabulary.subdomainSingular}.</p>}
          {model.members.map((member) => (
            <div className={s.memberCard} key={member.id}>
              <span className={s.memberCardMark}><UsersRound size={18} strokeWidth={1.2} /></span>
              <div>
                <strong>{member.name}</strong>
                {member.profileHref ? (
                  <a href={member.profileHref}>View profile <ArrowUpRight size={14} /></a>
                ) : (
                  <span className={s.managementStatus}>No public profile</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      {model.manageHref && (
        <a href={model.manageHref} className={s.quietLink}>Manage departments <ArrowUpRight size={14} /></a>
      )}
    </div>
  )
}