/** Lore source entity — safe display facts only; summaries are never synthesized at render time. */
export type LoreEntity = {
  id: number
  slug: string
  title: string
  group: string
  summary: string
  revisionLabel: string | null
  body: string
}

const ENTRY_BODY = (heading: string): string =>
  `# ${heading}\n\nThis entry is part of the Aster Reach lore index. The body below is deterministic fixture content supplied by the Lab, so a Design never has to invent summaries at render time.\n\n## Background\n\nThe settlement keeps its lore in the same archive as its records, because the council decided long ago that a place which forgets its own stories will misplace its documents too.\n\n## Detail\n\n- Entries are grouped by category in the fixture projection.\n- Each entry carries a stable slug and route.\n- Revision labels are supplied when the entry has been amended.\n\n_End of entry._`

export const LORE_ENTRIES: readonly LoreEntity[] = [
  { id: 1, slug: 'the-first-charter', title: 'The First Charter', group: 'Founding', summary: 'The one-sentence agreement that started the archive: whatever we find, we write down.', revisionLabel: null, body: ENTRY_BODY('The First Charter') },
  { id: 2, slug: 'the-logbook-era', title: 'The Logbook Era', group: 'Founding', summary: 'A decade of settlement history carried in a single defended logbook.', revisionLabel: 'Rev. 2', body: ENTRY_BODY('The Logbook Era') },
  { id: 3, slug: 'the-tangle', title: 'The Tangle', group: 'Places', summary: 'The dense belt of wreckage and vegetation that the first crossing navigated in 2024.', revisionLabel: null, body: ENTRY_BODY('The Tangle') },
  { id: 4, slug: 'new-harrow', title: 'New Harrow', group: 'Places', summary: 'The largest settlement on the Reach, home to the registry and the canal district.', revisionLabel: 'Rev. 3', body: ENTRY_BODY('New Harrow') },
  { id: 5, slug: 'the-kepler-collective', title: 'The Kepler Collective', group: 'Organizations', summary: 'A neighboring station polity bound to Aster Reach by the grain accords.', revisionLabel: null, body: ENTRY_BODY('The Kepler Collective') },
  { id: 6, slug: 'heritage-and-records', title: 'Heritage & Records', group: 'Organizations', summary: 'The directorate that keeps the archive\'s archive: public histories, personnel, and the collection.', revisionLabel: null, body: ENTRY_BODY('Heritage & Records') },
  { id: 7, slug: 'the-whisper-signal', title: 'The Whisper Signal', group: 'Events', summary: 'An unexplained repeating signal first logged by the xenological survey in late 2025.', revisionLabel: 'Rev. 1', body: ENTRY_BODY('The Whisper Signal') },
  { id: 8, slug: 'the-drydock-years', title: 'The Drydock Years', group: 'Events', summary: 'The era of orbital construction, and the decommission that closed the works.', revisionLabel: null, body: ENTRY_BODY('The Drydock Years') },
  { id: 9, slug: 'first-contact-protocol', title: 'First Contact Protocol', group: 'Practices', summary: 'The documentation-first procedure for any encounter with something new.', revisionLabel: 'Rev. 4', body: ENTRY_BODY('First Contact Protocol') },
  { id: 10, slug: 'annotation-not-editing', title: 'Annotation, Not Editing', group: 'Practices', summary: 'The archive rule that the past is never rewritten — only annotated.', revisionLabel: null, body: ENTRY_BODY('Annotation, Not Editing') },
]

export function loreBySlug(slug: string): LoreEntity | undefined {
  return LORE_ENTRIES.find((entry) => entry.slug === slug)
}

/** Stress variant: a long lore title/summary. */
export function stressLoreTitle(id: number): string | null {
  if (id === 4) return 'New Harrow — A Complete Settlement History from First Landfall to the Canal District Water Accord, Including Every Annex and Addendum'
  return null
}