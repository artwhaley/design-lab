/**
 * ActionLog — compact semantic event trace (T07). Records successes/failures
 * and navigation, with compact payloads — never huge fixture blobs.
 */
import { useSyncExternalStore } from 'react'
import type { ActionLog as ActionLogType } from '../workspaces'

type Props = {
  log: ActionLogType
}

export function ActionLog({ log }: Props) {
  const version = useSyncExternalStore(log.subscribe, () => log.entries.length)
  void version
  const entries = log.entries

  return (
    <div>
      <div className="lab-row" style={{ justifyContent: 'space-between' }}>
        <h3>Action log</h3>
        <button type="button" className="lab-button" onClick={() => log.clear()}>Clear</button>
      </div>
      <div className="lab-log" role="log" aria-label="Lab action log">
        {entries.length === 0 ? <p className="lab-hint">No actions yet.</p> : null}
        {entries.slice(-80).map((entry) => (
          <div key={entry.id} className={`lab-log-item${entry.level === 'error' ? ' lab-log-error' : ''}`}>
            <span className="lab-log-time">{entry.scope}.{entry.action}</span>
            {entry.detail}
          </div>
        ))}
      </div>
    </div>
  )
}