/**
 * Aster Reach — the single deterministic fictional Domain used by every Lab
 * scenario (A06). Names/relationships are stable across pages; no random IDs
 * or dates at runtime.
 */
import type { NavigationItem } from '../contracts'

export const DOMAIN_SLUG = 'aster-reach'
export const DOMAIN_NAME = 'Aster Reach'
export const DOMAIN_MOTTO = 'Memory is the anchor of every expedition.'
export const DOMAIN_DESCRIPTION = 'A settled star-colony archive and survey collective keeping the records of its founding, its expeditions, and its people.'
export const DOMAIN_DESCRIPTION_LONG =
  'Aster Reach began as a survey collective charting the inner belt. What started as a logbook became the settlement\'s memory: charters, censuses, expedition journals, treaties, and the everyday paperwork of a colony that insists on writing things down. Its archives are open to the public by design, with a small registry department guarding the records that need guarding.'
export const BASE_URL = `/domain/${DOMAIN_SLUG}`
export const PLATFORM_LABEL = 'LoreForge'

export const DOMAIN_LOGO_URL = '/media/lab-fixtures/aster-reach-logo.svg'
export const DOMAIN_SEAL_URL = '/media/lab-fixtures/aster-reach-seal.svg'
export const DOMAIN_BANNER_URL = '/media/lab-fixtures/aster-reach-banner.svg'
export const DOMAIN_BACKGROUND_URL = '/media/lab-fixtures/atmosphere.svg'

/** Stress variant: a deliberately painful Domain name to expose overflow. */
export const STRESS_DOMAIN_NAME = 'The Commonwealth of the Aster Reach Settlement, Outer Belt Survey & Colonial Archives'
export const STRESS_DOMAIN_MOTTO = 'Sixty years of records, every one of them filed, and we will file sixty more if it takes a hundred archivists to do it.'

export function primaryNavigation(persona: 'visitor' | 'member' | 'departmentManager' | 'admin'): NavigationItem[] {
  const items: NavigationItem[] = [
    { label: 'Home', segment: '', href: BASE_URL },
    { label: 'Records', segment: 'records', href: `${BASE_URL}/records` },
    { label: 'Departments', segment: 'departments', href: `${BASE_URL}/departments` },
    { label: 'About', segment: 'about', href: `${BASE_URL}/about` },
    { label: 'Lore', segment: 'lore', href: `${BASE_URL}/lore` },
    { label: 'Members', segment: 'members', href: `${BASE_URL}/members` },
  ]
  if (persona !== 'visitor') {
    items.push({ label: 'Work', segment: 'work', href: `${BASE_URL}/work` })
  }
  return items
}

export function managementNavigation(persona: 'visitor' | 'member' | 'departmentManager' | 'admin'): NavigationItem[] {
  if (persona === 'admin') {
    return [
      { label: 'Departments', segment: 'manage/departments', href: `${BASE_URL}/manage/departments` },
      { label: 'Folders', segment: 'manage/folders', href: `${BASE_URL}/manage/folders` },
      { label: 'Roles', segment: 'roles', href: `${BASE_URL}/roles` },
      { label: 'Document Types', segment: 'document-types', href: `${BASE_URL}/document-types` },
      { label: 'People', segment: 'manage/people', href: `${BASE_URL}/manage/people` },
      { label: 'Invitations', segment: 'manage/invitations', href: `${BASE_URL}/manage/invitations` },
    ]
  }
  if (persona === 'departmentManager') {
    return [
      { label: 'Folders', segment: 'manage/folders', href: `${BASE_URL}/manage/folders` },
      { label: 'Roles', segment: 'roles', href: `${BASE_URL}/roles` },
    ]
  }
  return []
}