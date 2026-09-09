import { DEPARTMENTS, type DepartmentEntity } from './departments'
import { DOCUMENT_TYPES, type DocumentTypeEntity } from './documentTypes'
import { FOLDERS, STRESS_FOLDER_CHAIN, type FolderEntity } from './folders'
import { LORE_ENTRIES, stressLoreTitle, type LoreEntity } from './lore'
import { CLAIM_REQUESTS, CLAIM_TARGETS, INVITATIONS, JOIN_REQUESTS, type ClaimRequestEntity, type InvitationEntity, type JoinRequestEntity } from './management'
import { MEMBERS, stressMemberName, type MemberEntity } from './members'
import { buildRecords, stressTitles, SUPERSESSION_EDGES, type RecordEntity } from './records'
import { ROLES, type RoleEntity } from './roles'
import type { SupersessionEdge } from '../contracts'
import type { DataStateKey, FixtureProfileKey } from './scenarios'
import { applyObsidianFidelityProfile } from './obsidianFidelity'
import {
  BASE_URL,
  DOMAIN_BACKGROUND_URL,
  DOMAIN_BANNER_URL,
  DOMAIN_DESCRIPTION,
  DOMAIN_DESCRIPTION_LONG,
  DOMAIN_LOGO_URL,
  DOMAIN_MOTTO,
  DOMAIN_NAME,
  DOMAIN_SLUG,
  STRESS_DOMAIN_MOTTO,
  STRESS_DOMAIN_NAME,
} from './baseDomain'

export type DomainFacts = {
  id: number
  slug: string
  name: string
  motto: string
  description: string
  descriptionLong: string
  logoUrl: string | null
  bannerUrl: string | null
  backgroundUrl: string | null
  baseUrl: string
}

export type Universe = {
  permissionRules?: Record<string, Record<string, import('@/components/people/PersonAccessTrees').PermissionState>>
  domain: DomainFacts
  departments: DepartmentEntity[]
  members: MemberEntity[]
  roles: RoleEntity[]
  folders: FolderEntity[]
  documentTypes: DocumentTypeEntity[]
  records: RecordEntity[]
  lore: LoreEntity[]
  invitations: InvitationEntity[]
  joinRequests: JoinRequestEntity[]
  claimRequests: ClaimRequestEntity[]
  claimTargets: Array<{ id: number; name: string }>
  supersessionEdges: SupersessionEdge[]
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const cloneArray = <T>(value: readonly T[]): T[] => JSON.parse(JSON.stringify(value)) as T[]

function stressUniverse(universe: Universe): Universe {
  const next = clone(universe)
  next.domain.name = STRESS_DOMAIN_NAME
  next.domain.motto = STRESS_DOMAIN_MOTTO
  // Long member names.
  for (const member of next.members) {
    const long = stressMemberName(member.id)
    if (long) member.displayName = long
  }
  // Long record titles + a 20+ tag record.
  for (const record of next.records) {
    const long = stressTitles(record.id)
    if (long) record.title = long
    if (record.id === 17) record.tags = [...record.tags, 'survey', 'cartography', 'charts', 'field-data', 'telemetry', 'reduction', 'sector-7', 'grid-14', 'pass-four', 'winter', 'campaign', 'anomaly', 'dust', 'calibration', 'relay-7', 'dockyard', 'first-pass', 'correction', 're-reduction', 'plot', 'draft', 'pending']
  }
  // Long lore title.
  for (const entry of next.lore) {
    const long = stressLoreTitle(entry.id)
    if (long) entry.title = long
  }
  // 4+ level folder chain.
  next.folders = [...next.folders, ...clone(STRESS_FOLDER_CHAIN)]
  return next
}

function emptyUniverse(base: Universe): Universe {
  const next = clone(base)
  next.departments = next.departments.filter((d) => d.id === 1 || d.id === 6)
  next.members = next.members.filter((m) => m.id === 1 || m.id === 7 || m.id === 21)
  next.roles = next.roles.filter((r) => r.id === 1 || r.id === 7)
  next.folders = next.folders.filter((f) => f.id === 1 || f.id === 20)
  next.documentTypes = next.documentTypes.filter((t) => t.id === 1 || t.id === 9)
  next.records = []
  next.lore = []
  next.invitations = []
  next.joinRequests = []
  next.claimRequests = []
  next.claimTargets = []
  next.supersessionEdges = []
  return next
}

/** Build a fresh deterministic Universe for a data state (never shared across scenarios). */
export function buildUniverse(dataState: DataStateKey, fixtureProfile: FixtureProfileKey = 'default'): Universe {
  const base: Universe = {
    domain: {
      id: 1,
      slug: DOMAIN_SLUG,
      name: DOMAIN_NAME,
      motto: DOMAIN_MOTTO,
      description: DOMAIN_DESCRIPTION,
      descriptionLong: DOMAIN_DESCRIPTION_LONG,
      logoUrl: DOMAIN_LOGO_URL,
      bannerUrl: DOMAIN_BANNER_URL,
      backgroundUrl: DOMAIN_BACKGROUND_URL,
      baseUrl: BASE_URL,
    },
    departments: cloneArray(DEPARTMENTS),
    members: cloneArray(MEMBERS),
    roles: cloneArray(ROLES),
    folders: cloneArray(FOLDERS),
    documentTypes: cloneArray(DOCUMENT_TYPES),
    records: buildRecords(),
    lore: cloneArray(LORE_ENTRIES),
    invitations: cloneArray(INVITATIONS),
    joinRequests: cloneArray(JOIN_REQUESTS),
    claimRequests: cloneArray(CLAIM_REQUESTS),
    claimTargets: cloneArray(CLAIM_TARGETS),
    supersessionEdges: cloneArray(SUPERSESSION_EDGES),
  }
  const profiled = fixtureProfile === 'obsidian-fidelity' ? applyObsidianFidelityProfile(base) : base
  if (dataState === 'empty') return emptyUniverse(profiled)
  if (dataState === 'stress') return stressUniverse(profiled)
  return profiled
}
