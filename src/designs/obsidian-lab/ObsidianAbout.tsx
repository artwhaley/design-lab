/**
 * Obsidian About — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianAbout.tsx), adapted
 * to the Lab AboutPageModel. The incubation copy hardcoded "Aster Reach"
 * prose; the Lab About model supplies only bodyHtml/destinations/editHref, so
 * the hero keeps the Obsidian structure with model-supplied content and no
 * invented domain facts (the domain name is part of the supplied body HTML).
 */
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react'
import type { AboutPageModel, LabPageProps } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

export function ObsidianAbout({ model }: LabPageProps<AboutPageModel, ObsidianConfig>) {
  return (
    <div className={s.publicPage}>
      <section className={s.aboutHero}>
        <p className={s.eyebrow}><Sparkles size={14} /> A WORLD TAKING SHAPE</p>
        <h1>We came here<br /><em>to make a home.</em></h1>
      </section>
      <section className={s.aboutStatement}>
        <div className={s.aboutMark} aria-hidden="true"><Compass size={32} strokeWidth={1} /></div>
        <div className={s.aboutCopy}>
          {model.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: model.bodyHtml }} />
          ) : (
            <p>This domain&rsquo;s story is still being written.</p>
          )}
          {model.editHref && (
            <a href={model.editHref} className={s.quietLink}>Edit this page <ArrowUpRight size={14} /></a>
          )}
        </div>
      </section>
      <nav className={s.aboutDestinations} aria-label="Continue exploring">
        {model.destinations.map((item, index) => (
          <a key={item.segment} href={item.href}>
            <span>0{index + 1}</span>
            <strong>{item.label}</strong>
            <ArrowUpRight size={19} />
          </a>
        ))}
      </nav>
    </div>
  )
}