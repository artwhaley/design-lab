/**
 * Obsidian Lore — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianLore.tsx), adapted
 * to the Lab LorePageModel (Bible §24): entries carry title/group/summary/
 * revisionLabel/href — there is no introduction, per-entry updatedLabel, or
 * article body in the Lab contract (see PAGE_MODEL_PRESSURE.md). The article
 * view is therefore not rendered; the index + overview are.
 */
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search, X } from 'lucide-react'
import type { LabPageProps, LorePageModel } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

function LoreIndex({ model }: { model: LorePageModel }) {
  const [query, setQuery] = useState('')
  const entries = useMemo(
    () => model.entries.filter((entry) =>
      `${entry.title} ${entry.group} ${entry.summary}`.toLowerCase().includes(query.toLowerCase())),
    [model.entries, query],
  )
  const groups = [...new Set(entries.map((entry) => entry.group))]
  return (
    <aside className={s.loreIndex} aria-label="Lore index">
      <div className={s.loreIndexHeading}><BookOpen size={17} /><span>THE LORE OF THE DOMAIN</span></div>
      <label className={s.loreSearch}>
        <Search size={15} />
        <span className={s.srOnly}>Search lore</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the lore" />
        {query && <button onClick={() => setQuery('')} aria-label="Clear lore search"><X size={14} /></button>}
      </label>
      <nav className={s.loreNav}>
        <a href={`${model.baseUrl}/lore`}><span>Overview</span><small>{model.entries.length}</small></a>
        {groups.map((group) => (
          <div key={group} className={s.loreGroup}>
            <p>{group}</p>
            {entries.filter((entry) => entry.group === group).map((entry) => (
              <a key={entry.slug} href={entry.href}>{entry.title}</a>
            ))}
          </div>
        ))}
      </nav>
      {entries.length === 0 && <p className={s.loreEmpty}>No lore matches that search.</p>}
    </aside>
  )
}

export function ObsidianLore({ model }: LabPageProps<LorePageModel, ObsidianConfig>) {
  return (
    <div className={s.lorePage}>
      <LoreIndex model={model} />
      <LoreOverview model={model} />
    </div>
  )
}

function LoreOverview({ model }: { model: LorePageModel }) {
  const groups = [...new Set(model.entries.map((entry) => entry.group))]
  return (
    <section className={s.loreOverview}>
      <p className={s.eyebrow}>WORLD GUIDE</p>
      <h1>The lore,<br /><em>written by its people.</em></h1>
      <div className={s.loreShelf}>
        {groups.length === 0 && <p className={s.loreEmpty}>No lore has been recorded yet.</p>}
        {groups.map((group, index) => {
          const entries = model.entries.filter((entry) => entry.group === group)
          return (
            <section key={group}>
              <div className={s.shelfHeading}>
                <span>0{index + 1}</span>
                <h2>{group}</h2>
                <small>{entries.length} entries</small>
              </div>
              <div className={s.loreCards}>
                {entries.map((entry) => (
                  <a key={entry.slug} href={entry.href}>
                    {entry.revisionLabel && <span>{entry.revisionLabel}</span>}
                    <h3>{entry.title}</h3>
                    <p>{entry.summary}</p>
                    <ArrowRight size={17} />
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}