import { Check, MoreHorizontal, UserRound } from 'lucide-react'
import type { Action } from '../source/controls'
import { ActionMenu } from '../source/controls'
import type { LabPageProps, WorkPageModel, WorkWorkspace } from '../../../contracts'
import type { ObsidianConfig } from '../config'
import s from '../source/obsidian.module.css'

type Props = LabPageProps<WorkPageModel, ObsidianConfig> & { workspace: WorkWorkspace }

/** Work keeps the source management vocabulary but binds every operation to the Lab workspace. */
export function WorkAdapter({ model, workspace }: Props) {
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
            {workspace.entries.map((entry) => {
              const actions: Action[] = entry.actions
                .filter((action) => action.state !== 'absent')
                .map((action) => ({ key: action.key, label: action.label, disabled: action.state === 'disabled', danger: action.kind === 'destructive' }))
              return (
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
                      trigger={<><MoreHorizontal size={18} /> Actions</>}
                      items={actions}
                      onAction={(action) => {
                        if (action.key === 'inspect') workspace.inspect(entry.id)
                        if (action.key === 'approve') void workspace.approve(entry.id)
                        if (action.key === 'return' || action.key === 'deny') void workspace.returnToDraft(entry.id)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
