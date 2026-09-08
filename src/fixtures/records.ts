import type { Lifecycle } from '../contracts'

/** Record source entity. The fake backend seeds from these; projections filter by persona. */
export type RecordEntity = {
  id: number
  title: string
  folderId: number | null
  documentTypeId: number | null
  departmentId: number
  preparedByMemberId: number
  updatedAt: string
  lifecycle: Lifecycle
  locked: boolean
  tags: string[]
  concerns: Array<{ name: string; relationshipLabel?: string }>
  body: string
  statusMessage: { code: string; text: string } | null
}

type Row = [
  id: number,
  title: string,
  folderId: number | null,
  typeId: number | null,
  deptId: number,
  preparedBy: number,
  date: string,
  lifecycle: Lifecycle,
  locked?: boolean,
]

/** Canonical row table — stable IDs, explicit cross-links. */
const ROWS: readonly Row[] = [
  // --- High Council / Administration ---------------------------------------
  [1, 'Directive 014: Standing Rules of Order for the High Council', 3, 1, 1, 1, '2025-11-02T10:00:00.000Z', 'filed'],
  [2, 'Directive 015: Delegation of Survey Authority to the Expedition Corps', 2, 1, 1, 1, '2025-11-18T10:00:00.000Z', 'filed'],
  [3, 'Directive 016: Record Retention Schedule, 2026 Revision', 2, 1, 1, 1, '2026-01-12T10:00:00.000Z', 'filed'],
  [4, 'Directive 017: Interim Protocol for First Contact Documentation', 2, 1, 1, 1, '2026-02-03T10:00:00.000Z', 'submitted'],
  [5, 'Directive 018: Personnel Record Handling Amendment', 4, 1, 1, 1, '2026-02-20T10:00:00.000Z', 'draft'],
  [6, 'Council Session Minutes — 2025-12-04', 3, 1, 1, 1, '2025-12-06T10:00:00.000Z', 'filed'],
  [7, 'Council Session Minutes — 2026-01-08', 3, 1, 1, 1, '2026-01-10T10:00:00.000Z', 'filed'],
  [8, 'Council Session Minutes — 2026-02-05', 3, 1, 1, 1, '2026-02-07T10:00:00.000Z', 'draft'],

  // --- Personnel ------------------------------------------------------------
  [9, 'Personnel Record — Ilyas Vance', 5, 8, 1, 1, '2025-09-01T10:00:00.000Z', 'filed'],
  [10, 'Personnel Record — Amara Okonkwo', 5, 8, 1, 2, '2025-09-02T10:00:00.000Z', 'filed', true],
  [11, 'Personnel Record — Priya Chandrasekhar', 5, 8, 1, 1, '2025-09-03T10:00:00.000Z', 'filed'],
  [12, 'Personnel Record — Odessa Kane (Retired)', 6, 8, 1, 1, '2025-09-04T10:00:00.000Z', 'filed'],
  [13, 'Oversight Committee Review — Survey Wing Budget FY26', 23, 1, 1, 1, '2026-01-28T10:00:00.000Z', 'filed'],

  // --- Survey & Cartography -------------------------------------------------
  [14, 'Survey Report AR-201: Inner Belt Sector 3 Charting Pass', 9, 5, 2, 5, '2025-08-14T10:00:00.000Z', 'filed'],
  [15, 'Survey Report AR-202: New Harrow Approach Corridors', 9, 5, 2, 10, '2025-09-22T10:00:00.000Z', 'filed'],
  [16, 'Survey Report AR-203: Grid 14 Quadrant Boundary Dispute', 9, 5, 2, 10, '2025-10-30T10:00:00.000Z', 'filed', true],
  [17, 'Survey Report AR-204: Sector 7 Telemetry Reduction, Pass Four', 9, 5, 2, 10, '2026-02-11T10:00:00.000Z', 'submitted'],
  [18, 'Survey Report AR-205: Trade Route Drift Assessment', 14, 5, 2, 5, '2026-02-19T10:00:00.000Z', 'draft'],
  [19, 'Cartographic Standard: Projection Conventions v3', 8, 5, 2, 5, '2024-11-10T10:00:00.000Z', 'superseded'],
  [20, 'Cartographic Standard: Projection Conventions v4 (supersedes v3)', 8, 5, 2, 5, '2025-10-05T10:00:00.000Z', 'filed'],
  [21, 'Charted Approach Plates — Aster Reach Dockyard', 8, 5, 2, 5, '2025-03-15T10:00:00.000Z', 'filed'],

  // --- Expedition Corps -----------------------------------------------------
  [22, 'Expedition Log — E-17 First Crossing of the Tangle', 10, 6, 4, 3, '2025-07-19T10:00:00.000Z', 'filed'],
  [23, 'Expedition Log — E-18 Survey Wing Joint Pass', 8, 6, 4, 3, '2025-09-02T10:00:00.000Z', 'filed'],
  [24, 'Expedition Log — E-19 Relay Station Maintenance Run', 8, 6, 4, 18, '2025-12-11T10:00:00.000Z', 'filed'],
  [25, 'Expedition Log — E-20 Deep Belt Reconnaissance, Day 1–12', 8, 6, 4, 3, '2026-01-19T10:00:00.000Z', 'submitted'],
  [26, 'Expedition Log — E-21 Wreck Survey of the Kestrel', 10, 6, 4, 18, '2026-02-15T10:00:00.000Z', 'draft'],
  [27, 'Field Notes — Relay Station 7 Anomaly Readings', 9, 9, 4, 8, '2025-10-01T10:00:00.000Z', 'filed'],
  [28, 'Field Notes — Approach Corridor Dust Density', 9, 9, 4, 14, '2025-11-20T10:00:00.000Z', 'filed'],
  [29, 'Field Notes — Tangle Outpost Structural Inspection', 10, 9, 4, 3, '2026-01-05T10:00:00.000Z', 'filed'],

  // --- Colonial Registry ----------------------------------------------------
  [30, 'Census Ledger — New Harrow, Second Quarter 2025', 13, 2, 3, 4, '2025-07-01T10:00:00.000Z', 'filed'],
  [31, 'Census Ledger — New Harrow, Third Quarter 2025', 13, 2, 3, 4, '2025-10-01T10:00:00.000Z', 'filed'],
  [32, 'Census Ledger — New Harrow, Fourth Quarter 2025', 13, 2, 3, 4, '2026-01-01T10:00:00.000Z', 'filed'],
  [33, 'Land Grant LG-221: Plot 14, New Harrow Terrace', 13, 3, 3, 4, '2025-06-14T10:00:00.000Z', 'filed'],
  [34, 'Land Grant LG-222: Plot 15, New Harrow Terrace', 13, 3, 3, 4, '2025-06-14T10:00:00.000Z', 'filed'],
  [35, 'Land Grant LG-223: Plot 22, Riverbend', 13, 3, 3, 4, '2025-08-30T10:00:00.000Z', 'filed'],
  [36, 'Trade Accord TA-11: Grain Exchange with the Kepler Collective', 14, 4, 3, 19, '2025-05-22T10:00:00.000Z', 'filed'],
  [37, 'Trade Accord TA-12: Water Rights, Lower Canal District', 14, 4, 3, 19, '2025-09-17T10:00:00.000Z', 'filed'],
  [38, 'Trade Accord TA-13: Tooling Cooperative Charter', 14, 4, 3, 19, '2026-01-25T10:00:00.000Z', 'submitted'],
  [39, 'Registry Circular: Identity Renewal Window Opens', 11, 2, 3, 4, '2026-01-08T10:00:00.000Z', 'filed'],

  // --- Xenological Studies --------------------------------------------------
  [40, 'Xenological Dossier: Thresher-Vine of the Tangle', 17, 7, 5, 2, '2025-06-20T10:00:00.000Z', 'filed'],
  [41, 'Xenological Dossier: Ridge-Borer Fauna, Sector 9', 18, 7, 5, 2, '2025-08-25T10:00:00.000Z', 'filed'],
  [42, 'Xenological Dossier: The Whisper Signal (initial assessment)', 16, 7, 5, 2, '2025-12-02T10:00:00.000Z', 'submitted'],
  [43, 'Xenological Dossier: Glow-Moss Cultivation Trials', 17, 7, 5, 13, '2026-01-30T10:00:00.000Z', 'draft'],
  [44, 'Specimen Log — Flora Collection, Pass 4', 17, 7, 5, 13, '2025-11-11T10:00:00.000Z', 'filed'],
  [45, 'Specimen Log — Fauna Observation, Relay 7 Perimeter', 18, 7, 5, 2, '2025-12-20T10:00:00.000Z', 'filed'],
  [46, 'Field Recording — Drone Array, Sector 9 Subsurface', 19, 7, 5, 12, '2026-01-15T10:00:00.000Z', 'filed'],

  // --- Heritage & Records ---------------------------------------------------
  [47, 'Public History: The Founding of Aster Reach', 21, 1, 6, 7, '2024-12-01T10:00:00.000Z', 'filed'],
  [48, 'Public History: The Drydock Years', 21, 1, 6, 7, '2025-04-10T10:00:00.000Z', 'filed'],
  [49, 'Public History: The Tangle Expedition of 2024', 21, 1, 6, 20, '2025-09-05T10:00:00.000Z', 'filed'],
  [50, 'Restricted History: Internal Review of the Kepler Accord', 22, 1, 6, 7, '2025-11-22T10:00:00.000Z', 'filed', true],
  [51, 'Restricted History: Personnel Inquiry, Orbital Works Closure', 22, 1, 6, 7, '2026-01-18T10:00:00.000Z', 'filed'],
  [52, 'Letters — Correspondence of the First Surveyor, Vol. 1', 26, 1, 6, 20, '2025-03-02T10:00:00.000Z', 'filed'],
  [53, 'Letters — Correspondence of the First Surveyor, Vol. 2', 26, 1, 6, 20, '2025-05-08T10:00:00.000Z', 'filed'],
  [54, 'Expedition Photos — First Crossing of the Tangle', 28, 1, 6, 20, '2025-08-01T10:00:00.000Z', 'superseded'],
  [55, 'Expedition Photos — First Crossing of the Tangle (Re-digitized)', 28, 1, 6, 20, '2026-01-22T10:00:00.000Z', 'filed'],
  [56, 'Inventory: Heritage Collection Shelf Audit FY25', 21, 1, 6, 9, '2025-12-15T10:00:00.000Z', 'filed'],

  // --- Supersession chains + deprecated -------------------------------------
  [57, 'Charting Standard AR-CS-02: Belt Nomenclature', 8, 5, 2, 5, '2023-02-10T10:00:00.000Z', 'superseded'],
  [58, 'Charting Standard AR-CS-03: Belt Nomenclature (revised)', 8, 5, 2, 5, '2025-03-18T10:00:00.000Z', 'filed'],
  [59, 'Expedition Log — E-14 Original Handwritten Ledger', 10, 6, 4, 3, '2024-04-20T10:00:00.000Z', 'superseded'],
  [60, 'Expedition Log — E-14 Digitized Edition', 10, 6, 4, 3, '2024-06-01T10:00:00.000Z', 'superseded'],
  [61, 'Expedition Log — E-14 Digitized Edition (Restored)', 10, 6, 4, 3, '2025-11-30T10:00:00.000Z', 'filed'],
  [62, 'Census Ledger — New Harrow, First Quarter 2025 (Superseded Draft)', 13, 2, 3, 4, '2025-03-28T10:00:00.000Z', 'superseded'],
  [63, 'Census Ledger — New Harrow, First Quarter 2025 (Final)', 13, 2, 3, 4, '2025-04-02T10:00:00.000Z', 'filed'],
  [64, 'Directive 011: Legacy Orbital Works Charter', 2, 1, 1, 1, '2022-09-01T10:00:00.000Z', 'deprecated'],
  [65, 'Public History: Centennial Preparations (Submitted Draft)', 21, 1, 6, 7, '2026-02-21T10:00:00.000Z', 'submitted'],
]

/** Long-body record for reading-surface coverage. */
export const LONG_BODY_RECORD_ID = 47

/** Stress variant: long titles, huge tag sets, longer bodies. */
export function stressTitles(id: number): string | null {
  const titles: Record<number, string> = {
    17: 'Survey Report AR-204: Sector 7 Telemetry Reduction, Pass Four — Corrected and Re-reduced Field Plots from the Extended Winter Survey Campaign of the Inner Belt Observation Program',
    40: 'Xenological Dossier: Thresher-Vine of the Tangle — Morphology, Reproductive Cycle, and Cultivation Risk Assessment for Settlement Boundary Plantings',
    49: 'Public History: The Tangle Expedition of 2024 — A Complete Narrative Account of the First Crossing, Including Appendices, Maps, and a Full Roster of Participants',
  }
  return titles[id] ?? null
}

// ---------------------------------------------------------------------------
// Deterministic bodies / tags / concerns
// ---------------------------------------------------------------------------

const BODY_TEMPLATES: Record<number, string> = {
  1: '## Standing Rules\n\nThese rules of order apply to all sessions of the High Council.\n\n- A quorum is nine members.\n- Motions require a second.\n- Minutes are filed within three days.\n\nThe council may amend these rules by two-thirds vote.',
  5: '## Purpose\n\nThis report summarises the findings of the survey pass.\n\n### Method\n\nField instruments were calibrated against the dockyard standard before departure. Readings were recorded at fifteen-minute intervals.\n\n### Findings\n\nThe pass confirmed the corridor is clear to the limits of the current chart. Two anomalies were noted and logged for the next reduction cycle.\n\n### Recommendation\n\nNo course change is required. The chart remains current.',
  6: '## Log\n\nDay one: departed dock at 06:00. Weather nominal.\n\nDay four: relay station 7 answered on the second hailing frequency.\n\nDay nine: encountered a debris field at grid 14; navigated around without incident.\n\nDay twelve: returned to dock. All hands accounted for.',
}

export function bodyFor(recordId: number, typeId: number | null): string {
  if (recordId === LONG_BODY_RECORD_ID) return LONG_BODY
  const template = BODY_TEMPLATES[typeId ?? 1] ?? BODY_TEMPLATES[1]
  return `${template}\n\n_Record ${recordId} — deterministic Lab fixture body._`
}

const LONG_BODY = `# The Founding of Aster Reach

## The First Charter

Aster Reach began as a survey collective charting the inner belt. The first charter, signed in the spring of the founding year, committed the signatories to a single sentence: *"Whatever we find, we write down."*

## The Logbook Era

For the first decade the entire archive was one logbook, carried from camp to camp and defended from weather, sand, and the occasional argument. When the logbook grew too large to carry, the collective built the first shelf. The shelf became a room. The room became this archive.

## The Charter of the Archive

In the founding year the council ratified the Archive Charter, which still governs the collection:

- Every expedition returns with a logbook or not at all.
- Public histories are public.
- Registry records are guarded.
- The past is not edited; it is annotated.

## Afterword

Sixty years of records, every one of them filed, and the archivists will file sixty more if it takes a hundred of them to do it. This history is maintained by the Heritage & Records directorate and revised only by annotation.

---

_End of record._`

export const TAG_POOLS: Record<number, string[]> = {
  1: ['council', 'directive', 'policy', 'governance'],
  2: ['registry', 'census', 'ledger', 'demographics'],
  3: ['registry', 'land', 'grant', 'property'],
  4: ['registry', 'trade', 'accord', 'treaty'],
  5: ['survey', 'cartography', 'charts', 'field-data'],
  6: ['expedition', 'logbook', 'field-notes'],
  7: ['xenology', 'specimen', 'dossier'],
  8: ['personnel', 'records', 'identity'],
  9: ['expedition', 'field-notes', 'raw'],
}

export const CONCERN_POOLS: Record<number, string[]> = {
  1: ['Retention', 'Public disclosure'],
  2: ['Privacy', 'Correction policy'],
  3: ['Public disclosure', 'Land rights'],
  4: ['Ratification status'],
  5: ['Instrument calibration', 'Duplicate chart risk'],
  6: ['Missing appendix'],
  7: ['Specimen safety', 'Cultural sensitivity'],
  8: ['Privacy', 'Identity verification'],
  9: ['Legibility', 'Duplicate notes'],
}

export const STRESS_TAGS = [
  'survey', 'cartography', 'charts', 'field-data', 'telemetry', 'reduction', 'sector-7', 'grid-14',
  'pass-four', 'winter', 'campaign', 'anomaly', 'dust', 'calibration', 'relay-7', 'dockyard',
  'first-pass', 'correction', 're-reduction', 'plot', 'draft', 'pending', 'review', 'corridor',
]

/** Build a fresh RecordEntity list with deterministic bodies/tags/concerns. */
export function buildRecords(): RecordEntity[] {
  const records: RecordEntity[] = ROWS.map(([id, title, folderId, typeId, deptId, preparedBy, date, lifecycle, locked = false]) => {
    const tags = [...(TAG_POOLS[typeId ?? 1] ?? TAG_POOLS[1])]
    if (lifecycle === 'superseded') tags.push('superseded')
    if (lifecycle === 'deprecated') tags.push('deprecated')
    const concerns = (CONCERN_POOLS[typeId ?? 1] ?? CONCERN_POOLS[1]).map((name) => ({ name }))
    return {
      id,
      title,
      folderId,
      documentTypeId: typeId,
      departmentId: deptId,
      preparedByMemberId: preparedBy,
      updatedAt: date,
      lifecycle,
      locked,
      tags,
      concerns,
      body: bodyFor(id, typeId),
      statusMessage: lifecycle === 'superseded'
        ? { code: 'superseded', text: 'This record has been superseded by a newer version.' }
        : lifecycle === 'deprecated'
          ? { code: 'deprecated', text: 'This record is deprecated and retained for reference only.' }
          : locked
            ? { code: 'locked', text: 'This record is locked and cannot be edited.' }
            : null,
    }
  })

  // Deterministic extra coverage: one record carries every concern example.
  const withConcerns = records.find((r) => r.id === 1)
  if (withConcerns) {
    withConcerns.concerns = [
      { name: 'Retention', relationshipLabel: 'Legal' },
      { name: 'Public disclosure', relationshipLabel: 'Council' },
      { name: 'Correction policy' },
    ]
  }

  // Unassigned + no-folder coverage.
  const unassigned = records.find((r) => r.id === 39)
  if (unassigned) { unassigned.folderId = null; unassigned.documentTypeId = null; unassigned.departmentId = 6 }
  const noFolder = records.find((r) => r.id === 46)
  if (noFolder) { noFolder.folderId = null }

  return records
}

export const SUPERSESSION_EDGES: Array<{ newerId: number; olderId: number }> = [
  { newerId: 58, olderId: 57 },
  { newerId: 61, olderId: 60 },
  { newerId: 63, olderId: 62 },
  { newerId: 20, olderId: 19 },
  { newerId: 55, olderId: 54 },
]