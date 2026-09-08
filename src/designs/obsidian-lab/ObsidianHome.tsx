/**
 * Obsidian Home — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/ObsidianHome.tsx), adapted
 * to the Lab HomePageModel. The atmosphere image is a Design config asset
 * (DesignAssetRef rule), supplied via runtime.config.
 */
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Layers3,
  UsersRound,
  Compass,
} from 'lucide-react'
import type { HomePageModel, LabPageProps } from '../../contracts'
import type { ObsidianConfig } from './config'
import s from './obsidian.module.css'

const icons = {
  about: Compass,
  lore: BookOpen,
  departments: UsersRound,
  records: Layers3,
}

export function ObsidianHome({ model, runtime }: LabPageProps<HomePageModel, ObsidianConfig>) {
  const atmosphereImage = runtime.config.atmosphereImage
  const words = model.domain.name.split(' ')
  const heroLead = words.slice(0, -1).join(' ')
  const heroEmphasis = words.at(-1) ?? model.domain.name
  return (
    <>
      <section className={s.hero}>
        {atmosphereImage && <img className={s.heroImage} src={atmosphereImage} alt="" fetchPriority="high" />}
        <div className={s.heroShade} />
        <div className={s.heroContent}>
          <p className={s.eyebrow}><span className={s.liveDot} /> THE DOMAIN ARCHIVE</p>
          <h1>{heroLead}<br /><em>{heroEmphasis}</em></h1>
          <p className={s.heroMotto}>{model.domain.motto}</p>
          <a href={`${model.baseUrl}/records`} className={s.primaryButton}>Enter the archive <ArrowUpRight size={18} /></a>
        </div>
        <a href="#welcome" className={s.heroScroll}><ArrowDown size={16} /><span>Explore the domain</span></a>
      </section>
      <div className={s.homeContent}>
        <section id="welcome" className={s.welcome}>
          <div>
            <p className={s.eyebrow}>A SHARED WORLD</p>
            <h2>A place.<br />A people.<br /><em>A living record.</em></h2>
          </div>
          <div className={s.welcomeBody}>
            {model.welcome.html ? (
              <div dangerouslySetInnerHTML={{ __html: model.welcome.html }} />
            ) : (
              <p>This is where your domain&rsquo;s story begins.</p>
            )}
            {model.welcome.editHref && (
              <a href={model.welcome.editHref} className={s.quietLink}>Edit welcome <ArrowUpRight size={14} /></a>
            )}
          </div>
        </section>
        <nav className={s.destinations} aria-label="Explore the domain">
          {model.destinations.map((item, i) => {
            const Icon = icons[item.segment as keyof typeof icons] ?? Compass
            return (
              <a key={item.segment} href={item.href}>
                <span className={s.destinationTop}><Icon size={24} strokeWidth={1.2} /><span>0{i + 1}</span></span>
                <span className={s.destinationName}>{item.label}<ArrowUpRight size={20} /></span>
              </a>
            )
          })}
        </nav>
        <section className={s.recentSection}>
          <div className={s.sectionHeading}>
            <div>
              <p className={s.eyebrow}>THE LATEST CHAPTER</p>
              <h2>Recently recorded</h2>
            </div>
            <a className={s.quietLink} href={`${model.baseUrl}/records`}>All records <ArrowRight size={17} /></a>
          </div>
          {model.recentRecords.length ? (
            <div className={s.recentGrid}>
              {model.recentRecords.slice(0, 3).map((record, index) => (
                <a className={s.recentCard} key={record.id} href={`${model.baseUrl}/documents/${record.id}`}>
                  <span className={s.recentTop}><span>{record.type}</span><span className={s.recordOrdinal}>0{index + 1}</span></span>
                  <h3>{record.title}</h3>
                  <span className={s.recentBottom}>{record.activity}<ArrowUpRight size={20} /></span>
                </a>
              ))}
            </div>
          ) : (
            <div className={s.empty}>
              <Layers3 size={30} />
              <h3>Your archive is ready.</h3>
              <p>No records have been filed yet.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}