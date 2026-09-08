/**
 * Finite Lab surface catalog (03_CONTRACT_AND_SURFACE_MATRIX.md). The host
 * navigates this list; the path simulator maps fixture hrefs onto it. There is
 * deliberately no router dependency (A08).
 */
import type { LabDesignDefinition } from './design'

export type ClassASurfaceKey =
  | 'home'
  | 'records'
  | 'document'
  | 'departments'
  | 'department'
  | 'about'
  | 'lore'
  | 'members'
  | 'member'
  | 'work'
  | 'management.departments'
  | 'management.folders'
  | 'management.roles'
  | 'management.documentTypes'
  | 'management.people'
  | 'management.person'
  | 'management.invitations'

export type ClassBSurfaceKey =
  | 'shared.forms'
  | 'shared.templates'
  | 'shared.import'
  | 'shared.documentEdit'
  | 'shared.documentHistory'
  | 'shared.pageEdit'
  | 'shared.siteStudio'

export type CompatSurfaceKey = 'compat.review' | 'compat.subdomains'

export type SurfaceKey = ClassASurfaceKey | ClassBSurfaceKey | CompatSurfaceKey | 'external'

export type SurfaceKind = 'classA' | 'classB' | 'compatibility' | 'external'

export type SurfaceDescriptor = {
  key: SurfaceKey
  label: string
  kind: SurfaceKind
  /** Representative canonical route family (for docs + path simulator). */
  routeFamily: string
  /** Dotted path into design.pages for Class A surfaces. */
  designSlot?: string
  /** Which fake workspace/action bridge this surface consumes. */
  bridge?: 'records' | 'document' | 'work' | 'folders' | 'roles' | 'documentTypes' | 'people' | 'person' | 'departments' | 'invitations'
}

export const SURFACE_CATALOG: readonly SurfaceDescriptor[] = [
  { key: 'home', label: 'Home', kind: 'classA', routeFamily: '/domain/[slug]', designSlot: 'pages.home' },
  { key: 'records', label: 'Records', kind: 'classA', routeFamily: '/domain/[slug]/records', designSlot: 'pages.records', bridge: 'records' },
  { key: 'document', label: 'Document', kind: 'classA', routeFamily: '/domain/[slug]/documents/[id]', designSlot: 'pages.document', bridge: 'document' },
  { key: 'departments', label: 'Departments', kind: 'classA', routeFamily: '/domain/[slug]/departments', designSlot: 'pages.departments' },
  { key: 'department', label: 'Department detail', kind: 'classA', routeFamily: '/domain/[slug]/departments/[departmentSlug]', designSlot: 'pages.department' },
  { key: 'about', label: 'About', kind: 'classA', routeFamily: '/domain/[slug]/about', designSlot: 'pages.about' },
  { key: 'lore', label: 'Lore', kind: 'classA', routeFamily: '/domain/[slug]/lore', designSlot: 'pages.lore' },
  { key: 'members', label: 'Members', kind: 'classA', routeFamily: '/domain/[slug]/members', designSlot: 'pages.members' },
  { key: 'member', label: 'Member profile', kind: 'classA', routeFamily: '/domain/[slug]/members/[characterId]', designSlot: 'pages.member' },
  { key: 'work', label: 'Work', kind: 'classA', routeFamily: '/domain/[slug]/work', designSlot: 'pages.work', bridge: 'work' },
  { key: 'management.departments', label: 'Manage Departments', kind: 'classA', routeFamily: '/domain/[slug]/manage/departments', designSlot: 'pages.management.departments', bridge: 'departments' },
  { key: 'management.folders', label: 'Manage Folders', kind: 'classA', routeFamily: '/domain/[slug]/manage/folders', designSlot: 'pages.management.folders', bridge: 'folders' },
  { key: 'management.roles', label: 'Manage Roles', kind: 'classA', routeFamily: '/domain/[slug]/roles', designSlot: 'pages.management.roles', bridge: 'roles' },
  { key: 'management.documentTypes', label: 'Document Types', kind: 'classA', routeFamily: '/domain/[slug]/document-types', designSlot: 'pages.management.documentTypes', bridge: 'documentTypes' },
  { key: 'management.people', label: 'Manage People', kind: 'classA', routeFamily: '/domain/[slug]/manage/people', designSlot: 'pages.management.people', bridge: 'people' },
  { key: 'management.person', label: 'Person workspace', kind: 'classA', routeFamily: '/domain/[slug]/manage/people/[characterId]', designSlot: 'pages.management.person', bridge: 'person' },
  { key: 'management.invitations', label: 'Manage Invitations', kind: 'classA', routeFamily: '/domain/[slug]/manage/invitations', designSlot: 'pages.management.invitations', bridge: 'invitations' },

  { key: 'shared.forms', label: 'Forms (shared)', kind: 'classB', routeFamily: '/domain/[slug]/forms' },
  { key: 'shared.templates', label: 'Templates (shared)', kind: 'classB', routeFamily: '/domain/[slug]/templates' },
  { key: 'shared.import', label: 'Import (shared)', kind: 'classB', routeFamily: '/domain/[slug]/import' },
  { key: 'shared.documentEdit', label: 'Document editor (shared)', kind: 'classB', routeFamily: '/domain/[slug]/documents/[id]/edit' },
  { key: 'shared.documentHistory', label: 'Document history (shared)', kind: 'classB', routeFamily: '/domain/[slug]/documents/[id]/history' },
  { key: 'shared.pageEdit', label: 'Page editor (shared)', kind: 'classB', routeFamily: '/domain/[slug]/pages/[pageSlug]/edit' },
  { key: 'shared.siteStudio', label: 'Site Studio (shared)', kind: 'classB', routeFamily: '/domain/[slug]/customize' },

  { key: 'compat.review', label: 'Review (→ Work)', kind: 'compatibility', routeFamily: '/domain/[slug]/review' },
  { key: 'compat.subdomains', label: 'Subdomains (→ Departments)', kind: 'compatibility', routeFamily: '/domain/[slug]/subdomains' },

  { key: 'external', label: 'External / global', kind: 'external', routeFamily: '(global routes)' },
]

export const CLASS_A_KEYS: readonly ClassASurfaceKey[] = SURFACE_CATALOG.filter((s) => s.kind === 'classA').map((s) => s.key as ClassASurfaceKey)
export const CLASS_B_KEYS: readonly ClassBSurfaceKey[] = SURFACE_CATALOG.filter((s) => s.kind === 'classB').map((s) => s.key as ClassBSurfaceKey)
export const COMPAT_KEYS: readonly CompatSurfaceKey[] = SURFACE_CATALOG.filter((s) => s.kind === 'compatibility').map((s) => s.key as CompatSurfaceKey)

export const surfaceByKey = (key: SurfaceKey): SurfaceDescriptor => {
  const found = SURFACE_CATALOG.find((s) => s.key === key)
  if (!found) throw new Error(`Unknown Lab surface: ${key}`)
  return found
}

// ---------------------------------------------------------------------------
// Requiredness / conformance helpers
// ---------------------------------------------------------------------------

/** All required first-class design slots as dotted paths (T02 contract). */
export const REQUIRED_DESIGN_SLOTS: readonly string[] = [
  'home',
  'records',
  'document',
  'departments',
  'department',
  'about',
  'lore',
  'members',
  'member',
  'work',
  'management.departments',
  'management.folders',
  'management.roles',
  'management.documentTypes',
  'management.people',
  'management.person',
  'management.invitations',
]

function slotAt(design: LabDesignDefinition, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((value, part) => {
    if (value == null || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[part]
  }, design.pages)
}

/** Returns the dotted keys of required slots a design is missing. */
export function missingRequiredSlots(design: LabDesignDefinition): string[] {
  return REQUIRED_DESIGN_SLOTS.filter((slot) => typeof slotAt(design, slot) !== 'function')
}