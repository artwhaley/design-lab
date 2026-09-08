/**
 * Obsidian Departments — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianDepartments.tsx),
 * adapted to the Lab DepartmentsPageModel (name/slug/description/memberCount
 * supplied; no invented office copy).
 */
import { ArrowUpRight, Building2, UsersRound } from 'lucide-react'
import type { DepartmentsPageModel, LabPageProps } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

export function ObsidianDepartments({ model }: LabPageProps<DepartmentsPageModel, ObsidianConfig>) {
  return (
    <div className={s.publicPage}>
      <section className={s.directoryHeading}>
        <p className={s.eyebrow}>THE PEOPLE WHO KEEP THINGS GOING</p>
        <h1>Offices of<br /><em>the domain.</em></h1>
      </section>
      <section className={s.departmentGrid} aria-label="Departments">
        {model.departments.map((department) => (
          <DepartmentCard key={department.id} department={department} baseUrl={model.baseUrl} />
        ))}
      </section>
      {model.departments.length === 0 && <p className={s.managementEmpty}>No departments have been formed yet.</p>}
      {model.manageHref && (
        <a href={model.manageHref} className={s.quietLink}>Manage departments <ArrowUpRight size={14} /></a>
      )}
    </div>
  )
}

function DepartmentCard({ department, baseUrl }: {
  department: DepartmentsPageModel['departments'][number]
  baseUrl: string
}) {
  return (
    <a className={s.departmentCard} href={`${baseUrl}/departments/${department.slug}`}>
      <span className={s.departmentIcon}><Building2 size={23} strokeWidth={1.2} /></span>
      <span className={s.departmentCardTop}><span>{department.memberCount} members</span><ArrowUpRight size={18} /></span>
      <strong>{department.name}</strong>
      <p>{department.description ?? 'A working group of the domain.'}</p>
      <span className={s.departmentFoot}><UsersRound size={14} /> View the office</span>
    </a>
  )
}