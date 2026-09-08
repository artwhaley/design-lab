import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import type { InvitationsManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { ActionMenu, ChoiceMenu } from '../../source/controls'
import s from '../../source/obsidian.module.css'

export function InvitationsAdapter({ model, workspace }: InvitationsManagementPageProps<ObsidianConfig>) {
  const [purpose, setPurpose] = useState('join')
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>ACCESS CONTROL</p>
          <h1>Invitations</h1>
          <p>Invite people to join the domain or claim a character.</p>
        </div>
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      {model.canManage && (
        <form className={s.inviteForm} onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const target = new FormData(form).get('target')?.toString().trim() ?? ''
          if (target) void workspace.createInvitation({ purpose, targetLabel: target })
          form.reset()
        }}>
          <ChoiceMenu label="Invitation purpose" value={purpose} onChange={setPurpose} choices={[{ value: 'join', label: 'Join' }, { value: 'claim', label: 'Claim character' }]} />
          <label className={s.search}><Search size={18} /><span className={s.srOnly}>Target</span><input name="target" placeholder={purpose === 'join' ? 'Email address' : 'Character name'} /></label>
          <button type="submit" className={s.primaryButton}><Plus size={16} /> Send invitation</button>
        </form>
      )}
      <section className={s.managementSurface} aria-label="Invitations">
        <div className={s.managementTable}>
          <div className={s.managementHead}><span>Purpose</span><span>Target</span><span>Status</span><span className={s.srOnly}>Actions</span></div>
          {workspace.invitations.map((invitation) => (
            <div className={s.managementRow} key={invitation.id}>
              <strong>{invitation.purpose}</strong>
              <span>{invitation.targetLabel}</span>
              <span className={s.managementStatus}>{invitation.statusLabel}</span>
              <ActionMenu
                label={`Actions for ${invitation.targetLabel}`}
                trigger={<><MoreHorizontal size={18} /> Actions</>}
                items={invitation.canRevoke ? [{ key: 'revoke', label: 'Revoke', danger: true }] : []}
                onAction={(action) => { if (action.key === 'revoke') void workspace.revokeInvitation(invitation.id) }}
              />
            </div>
          ))}
        </div>
        <div className={s.requestColumns}>
          <div className={s.requestColumn}>
            <p className={s.eyebrow}>PENDING JOINS</p>
            {workspace.pendingJoins.length === 0 ? <p className={s.managementEmpty}>None.</p> : workspace.pendingJoins.map((join) => (
              <div className={s.requestRow} key={join.id}>
                <span>{join.applicantLabel} → {join.characterLabel}</span>
                <ActionMenu label={`Actions for ${join.applicantLabel}`} trigger={<><MoreHorizontal size={16} /> Actions</>} items={[{ key: 'approve', label: 'Approve' }, { key: 'deny', label: 'Deny', danger: true }]} onAction={(action) => { if (action.key === 'approve') void workspace.approveJoin(join.id); if (action.key === 'deny') void workspace.denyJoin(join.id) }} />
              </div>
            ))}
          </div>
          <div className={s.requestColumn}>
            <p className={s.eyebrow}>PENDING CLAIMS</p>
            {workspace.pendingClaims.length === 0 ? <p className={s.managementEmpty}>None.</p> : workspace.pendingClaims.map((claim) => (
              <div className={s.requestRow} key={claim.id}>
                <span>{claim.characterLabel} ← {claim.claimantLabel}</span>
                <ActionMenu label={`Actions for ${claim.claimantLabel}`} trigger={<><MoreHorizontal size={16} /> Actions</>} items={[{ key: 'approve', label: 'Approve' }, { key: 'deny', label: 'Deny', danger: true }]} onAction={(action) => { if (action.key === 'approve') void workspace.approveClaim(claim.id); if (action.key === 'deny') void workspace.denyClaim(claim.id) }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
