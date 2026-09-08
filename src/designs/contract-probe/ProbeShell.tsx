/**
 * Contract Probe Shell — plain but complete. Renders the authorized
 * DomainShellModel exactly as supplied: OperatingContext exactly once, Domain
 * identity, primary navigation, Work access, management navigation, content
 * region, and the platform escape route. Nothing is invented when absent.
 */
import type { LabShellProps } from '../../contracts'
import type { ProbeConfigV1 } from './config'
import './probe.css'

export function ProbeShell({ model, runtime, children }: LabShellProps<ProbeConfigV1>) {
  const { domain, primaryNavigation, managementNavigation, operatingContext, routes } = model
  return (
    <div className="probe-shell" data-density={runtime.config.density}>
      {/* OperatingContext exactly once (Bible §13) */}
      <div className="probe-context" data-testid="probe-operating-context">
        <span>{operatingContext.platformLabel}</span>
        {operatingContext.availableDomains.length > 0 ? (
          <select aria-label="Switch domain" defaultValue={String(operatingContext.activeDomainId)}>
            {operatingContext.availableDomains.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        ) : null}
        {operatingContext.availableCharacters.length > 0 ? (
          <select aria-label="Acting character" defaultValue={operatingContext.activeCharacterId != null ? String(operatingContext.activeCharacterId) : ''}>
            {operatingContext.availableCharacters.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        ) : null}
        {operatingContext.account ? (
          <span>{operatingContext.account.name} · {operatingContext.account.email}</span>
        ) : null}
        <a className="probe-context-escape" href="/account">Account &amp; dashboard</a>
      </div>

      <header className="probe-masthead">
        {domain.logoUrl ? <img src={domain.logoUrl} alt={`${domain.name} seal`} /> : null}
        <div>
          <h1>{domain.name}</h1>
          {domain.motto ? <div className="probe-motto">{domain.motto}</div> : null}
        </div>
      </header>

      <nav className="probe-nav" aria-label={`${domain.name} primary navigation`}>
        {primaryNavigation.map((item) => (
          <a key={item.segment} href={item.href}>{item.label}</a>
        ))}
        {primaryNavigation.some((n) => n.segment === 'work') ? null : <a href={routes.workUrl}>Work</a>}
      </nav>

      {managementNavigation.length > 0 ? (
        <nav className="probe-nav" aria-label="Management navigation">
          {managementNavigation.map((item) => (
            <a key={item.segment} className="probe-nav-mgmt" href={item.href}>{item.label}</a>
          ))}
        </nav>
      ) : null}

      <main className="probe-content">{children}</main>

      <footer className="probe-footer">
        {domain.name} · Contract Probe Design · Lab contract emulator surface
      </footer>
    </div>
  )
}