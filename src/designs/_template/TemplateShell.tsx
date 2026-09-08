/**
 * <Name> Shell — template skeleton.
 *
 * Receives the authorized DomainShellModel: domain identity, primary +
 * management navigation, operating context (platform label, domain/character
 * switchers, account), and the routes. Render children inside <main>.
 * See contracts/pageModels.ts → DomainShellModel for every supplied field.
 */
import type { LabShellProps } from '../../contracts'
import type { TemplateConfigV1 } from './config'
import './template.css'

export function TemplateShell({ model, children }: LabShellProps<TemplateConfigV1>) {
  const { domain, primaryNavigation, managementNavigation, operatingContext } = model
  return (
    <div className="template-shell">
      <div className="template-context">
        <span>{operatingContext.platformLabel}</span>
        {operatingContext.availableDomains.length > 0 ? (
          <select aria-label="Switch domain" defaultValue={String(operatingContext.activeDomainId)}>
            {operatingContext.availableDomains.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
        ) : null}
        {operatingContext.availableCharacters.length > 0 ? (
          <select aria-label="Acting character" defaultValue={operatingContext.activeCharacterId != null ? String(operatingContext.activeCharacterId) : ''}>
            {operatingContext.availableCharacters.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        ) : null}
        {operatingContext.account ? <span>{operatingContext.account.name}</span> : null}
      </div>

      <header className="template-masthead">
        {domain.logoUrl ? <img src={domain.logoUrl} alt={`${domain.name} seal`} /> : null}
        <div>
          <h1>{domain.name}</h1>
          {domain.motto ? <div className="template-motto">{domain.motto}</div> : null}
        </div>
      </header>

      <nav className="template-nav" aria-label="Primary navigation">
        {primaryNavigation.map((item) => <a key={item.segment} href={item.href}>{item.label}</a>)}
      </nav>
      {managementNavigation.length > 0 ? (
        <nav className="template-nav" aria-label="Management navigation">
          {managementNavigation.map((item) => <a key={item.segment} href={item.href}>{item.label}</a>)}
        </nav>
      ) : null}

      <main className="template-content">{children}</main>

      <footer className="template-footer">{domain.name} · {'<Name> Design'}</footer>
    </div>
  )
}