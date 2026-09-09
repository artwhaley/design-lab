/**
 * Probe-internal presentational helpers. These belong to the Contract Probe
 * Design only (A12) and must not become a shared visual library for future
 * Designs.
 */
import type { ReactNode } from 'react'

/** Probe-local action descriptor — not a shared Design API (A12). */
export type ProbeAction = {
  key: string
  label: string
  state: 'available' | 'disabled' | 'absent'
  disabledReason?: string
  kind?: 'primary' | 'destructive'
}

export function Section(props: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="probe-section">
      <h2>{props.title}</h2>
      {props.hint ? <p className="probe-hint" style={{ color: 'var(--probe-muted)', fontSize: 13, marginTop: 0 }}>{props.hint}</p> : null}
      {props.children}
    </section>
  )
}

export function Field(props: { label: string; value: ReactNode }) {
  return (
    <div className="probe-field">
      <span className="probe-label">{props.label}</span>
      <span>{props.value ?? <span className="probe-empty-inline" style={{ color: 'var(--probe-muted)' }}>—</span>}</span>
    </div>
  )
}

export function Tag(props: { children: ReactNode }) {
  return <span className="probe-tag">{props.children}</span>
}

export function Badge(props: { state: ProbeAction['state']; children: ReactNode }) {
  return <span className={`probe-badge probe-badge-${props.state}`}>{props.children}</span>
}

export function LifecycleBadge(props: { children: ReactNode }) {
  return <span className="probe-badge probe-badge-lifecycle">{props.children}</span>
}

export function Capabilities(props: { title: string; capabilities: Record<string, boolean | undefined> }) {
  const rows = Object.entries(props.capabilities)
  return (
    <Section title={props.title}>
      <div className="probe-grid">
        {rows.map(([key, value]) => (
          <div key={key} className="probe-card">
            <Field label={key} value={value ? 'available' : 'absent'} />
          </div>
        ))}
      </div>
    </Section>
  )
}

export function ActionButtons(props: { actions: ProbeAction[]; onRun(key: string): void }) {
  // Absent actions are NOT offered (Bible §54): never convert absent into
  // disabled just to balance a toolbar.
  const present = props.actions.filter((action) => action.state !== 'absent')
  if (present.length === 0) return null
  return (
    <div className="probe-actions">
      {present.map((action) => (
        <button
          key={action.key}
          type="button"
          className={`probe-button${action.kind === 'primary' ? ' probe-button-primary' : action.kind === 'destructive' ? ' probe-button-danger' : ''}`}
          disabled={action.state === 'disabled'}
          title={action.state === 'disabled' ? action.disabledReason : undefined}
          onClick={() => props.onRun(action.key)}
        >
          {action.label}
          <Badge state={action.state}>{action.state}</Badge>
        </button>
      ))}
    </div>
  )
}

export function EmptyState(props: { title: string; children?: ReactNode }) {
  return (
    <div className="probe-empty">
      <strong>{props.title}</strong>
      {props.children ? <div>{props.children}</div> : null}
    </div>
  )
}

export function LoadingState(props: { label?: string }) {
  return <p className="probe-loading" role="status">Loading{props.label ? ` ${props.label}` : ''}…</p>
}

export function ErrorState(props: { message: string }) {
  return <p className="probe-error" role="alert">{props.message}</p>
}

export function DebugId(props: { id: number | string | null | undefined; enabled: boolean }) {
  if (!props.enabled || props.id == null) return null
  return <span className="probe-debug">#{props.id}</span>
}

export function Pending(props: { pending: string | null }) {
  if (!props.pending) return null
  return <p className="probe-pending">Pending mutation: {props.pending}…</p>
}