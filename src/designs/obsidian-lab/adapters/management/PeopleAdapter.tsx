import { Search, UserRound } from 'lucide-react'
import type { PeopleManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import s from '../../source/obsidian.module.css'

/** Directory search is a controlled Lab workspace; this adapter owns presentation only. */
export function PeopleAdapter({ model, workspace }: PeopleManagementPageProps<ObsidianConfig>) {
  return (
    <div className={s.workspacePage}>
      <header className={s.pageHeading}>
        <div>
          <p className={s.eyebrow}>DIRECTORY ADMIN</p>
          <h1>People</h1>
          <p>Find a person to manage their roles and access.</p>
        </div>
      </header>
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      <section className={s.managementSurface} aria-label="People search">
        {model.canOpenPeople ? (
          <>
            <div className={s.managementToolbar}>
              <label className={s.search}>
                <Search size={18} />
                <span className={s.srOnly}>Search people</span>
                <input value={workspace.query} onChange={(event) => workspace.setQuery(event.target.value)} placeholder="Name or email…" />
              </label>
            </div>
            {workspace.searching && <p className={s.managementStatus}>Searching the directory…</p>}
            <div className={s.peopleResultsGrid}>
              {workspace.results.map((person) => (
                <a className={s.personResult} key={person.characterId} href={person.href} onClick={() => workspace.select(person.characterId)}>
                  <UserRound size={18} strokeWidth={1.2} />
                  <span>{person.name}</span>
                </a>
              ))}
              {workspace.query && workspace.results.length === 0 && !workspace.searching && <p className={s.managementEmpty}>No people match “{workspace.query}”.</p>}
            </div>
          </>
        ) : (
          <div className={s.empty}><UserRound size={28} /><h2>No access to people search.</h2><p>Only viewers with people-management permission can use this surface.</p></div>
        )}
      </section>
    </div>
  )
}
