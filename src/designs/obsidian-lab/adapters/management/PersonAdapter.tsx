import { MoreHorizontal, SlidersHorizontal, UserRound } from 'lucide-react'
import type { PersonManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { ActionMenu } from '../../source/controls'
import s from '../../source/obsidian.module.css'

export function PersonAdapter({ model, workspace }: PersonManagementPageProps<ObsidianConfig>) {
  const assignable = workspace.roleFilter === 'assignable'
  const roles = model.roleDepartments.flatMap((department) => department.roles.map((role) => ({ ...role, department: department.name })))
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
        {roles.length === 0 ? (
          <div className={s.empty}><UserRound size={28} /><h2>No role assignments.</h2><p>This person has no roles in the current domain.</p></div>
        ) : (
          <div className={s.managementTable}>
            <div className={s.managementHead}><span>Role</span><span>Department</span><span className={s.srOnly}>Actions</span></div>
            {roles.map((role) => (
              <div className={s.managementRow} key={role.id}>
                <strong>{role.name}</strong>
                <span>{role.department}</span>
                {workspace.canManageMembers ? (
                  <ActionMenu
                    label={`Actions for ${role.name}`}
                    trigger={<><MoreHorizontal size={18} /> Actions</>}
                    items={assignable ? [{ key: 'assign', label: 'Assign' }] : [{ key: 'unassign', label: 'Unassign', danger: true }]}
                    onAction={(action) => { if (action.key === 'assign') void workspace.assignRole(role.id); if (action.key === 'unassign') void workspace.unassignRole(role.id) }}
                  />
                ) : <span className={s.managementStatus}>Read only</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
