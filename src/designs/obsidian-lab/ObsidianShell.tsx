/**
 * Obsidian Shell — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianShell.tsx), adapted
 * to LabShellProps. The Lab's OperatingContext facts (platform label, domain
 * and character switchers, account) live in the DomainShellModel and are
 * rendered here exactly once (Bible §13); the token vars are already applied
 * by the Lab host at the preview root, so the Shell adds no inline styles.
 */
import { ArrowUpRight, Settings2 } from 'lucide-react'
import type { DomainShellModel, LabShellProps } from '../../contracts'
import { Navigation } from './Navigation'
import { ActionMenu } from './controls'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

export function ObsidianShell({ model, children }: LabShellProps<ObsidianConfig>) {
  return (
    <div className={s.root}>
      <a href="#main-content" className={s.skip}>Skip to content</a>
      <div className={s.contextBar}>
        <a href="/" className={s.platform}>LOREFORGE <ArrowUpRight size={12} /></a>
        <OperatingContext model={model} />
      </div>
      <div className={s.navPosition}>
        <Navigation model={model} />
      </div>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className={s.footer}>
        <div>
          <span className={s.footerMark}>◈</span> {model.domain.name}
          <span className={s.footerMotto}>{model.domain.motto}</span>
        </div>
        <div className={s.footerLinks}>
          {model.managementNavigation.length > 0 && (
            <ActionMenu
              label="Manage domain"
              trigger={<><Settings2 size={15} /> Manage domain</>}
              items={model.managementNavigation.map((item) => ({ key: item.segment, label: item.label, href: item.href }))}
            />
          )}
          <a href="/">LoreForge dashboard <ArrowUpRight size={14} /></a>
        </div>
      </footer>
    </div>
  )
}

/** Renders the Lab OperatingContext model — exactly once per Shell mount. */
function OperatingContext({ model }: { model: DomainShellModel }) {
  const { operatingContext } = model
  return (
    <span className={s.operatingContext}>
      {operatingContext.availableDomains.length > 0 && (
        <select aria-label="Switch domain" defaultValue={String(operatingContext.activeDomainId)}>
          {operatingContext.availableDomains.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
        </select>
      )}
      {operatingContext.availableCharacters.length > 0 && (
        <select aria-label="Acting character" defaultValue={operatingContext.activeCharacterId != null ? String(operatingContext.activeCharacterId) : ''}>
          {operatingContext.availableCharacters.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      )}
      {operatingContext.account && (
        <span className={s.account}>{operatingContext.account.name}</span>
      )}
    </span>
  )
}