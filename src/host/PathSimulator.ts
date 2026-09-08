/**
 * PathSimulator — maps canonical-looking fixture hrefs onto the finite Lab
 * surface catalog (T06). Designs never import this; they only render hrefs
 * supplied by models/workspaces (A18). Unknown/global links resolve to the
 * external class and are logged, never navigated.
 */
import type { SurfaceKey } from '../contracts'

export type SimulatedTarget =
  | { kind: 'surface'; surface: SurfaceKey; params: SurfaceParams; viaCompat?: 'review' | 'subdomains' }
  | { kind: 'external'; href: string }

export type SurfaceParams = {
  recordId?: number
  departmentSlug?: string
  characterId?: number
  loreSlug?: string
  folderId?: number | null
}

const idOf = (segment: string | undefined): number | null => {
  const value = Number(segment)
  return Number.isFinite(value) && value > 0 ? value : null
}

export class PathSimulator {
  readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  simulate(href: string): SimulatedTarget {
    if (href === this.baseUrl || href === `${this.baseUrl}/`) {
      return { kind: 'surface', surface: 'home', params: {} }
    }
    if (!href.startsWith(`${this.baseUrl}/`)) {
      return { kind: 'external', href }
    }
    const cleanHref = href.split('?')[0]
    const path = cleanHref.slice(this.baseUrl.length + 1)
    const [first, second, third] = path.split('/')

    switch (first) {
      case 'records': {
        if (second === 'new') return { kind: 'external', href }
        const folder = new URLSearchParams(href.split('?')[1] ?? '').get('folder')
        return {
          kind: 'surface',
          surface: 'records',
          params: { folderId: folder !== null ? Number(folder) || null : null },
        }
      }
      case 'documents': {
        if (second === undefined) return { kind: 'surface', surface: 'records', params: {} }
        const recordId = idOf(second)
        if (recordId === null) return { kind: 'external', href }
        if (third === 'edit') return { kind: 'surface', surface: 'shared.documentEdit', params: { recordId } }
        if (third === 'history') return { kind: 'surface', surface: 'shared.documentHistory', params: { recordId } }
        return { kind: 'surface', surface: 'document', params: { recordId } }
      }
      case 'departments':
        if (second === undefined) return { kind: 'surface', surface: 'departments', params: {} }
        return { kind: 'surface', surface: 'department', params: { departmentSlug: second } }
      case 'about':
        return { kind: 'surface', surface: 'about', params: {} }
      case 'lore':
        if (second === undefined) return { kind: 'surface', surface: 'lore', params: {} }
        return { kind: 'surface', surface: 'lore', params: { loreSlug: second } }
      case 'members':
        if (second === undefined) return { kind: 'surface', surface: 'members', params: {} }
        return { kind: 'external', href }
      case 'work':
        return { kind: 'surface', surface: 'work', params: {} }
      case 'review':
        return { kind: 'surface', surface: 'work', params: {}, viaCompat: 'review' }
      case 'subdomains':
        return { kind: 'surface', surface: 'departments', params: {}, viaCompat: 'subdomains' }
      case 'manage':
        if (second === 'departments') return { kind: 'surface', surface: 'management.departments', params: {} }
        if (second === 'folders') return { kind: 'surface', surface: 'management.folders', params: {} }
        if (second === 'people') {
          const characterId = idOf(third)
          if (characterId !== null) return { kind: 'surface', surface: 'management.person', params: { characterId } }
          return { kind: 'surface', surface: 'management.people', params: {} }
        }
        if (second === 'invitations') return { kind: 'surface', surface: 'management.invitations', params: {} }
        return { kind: 'external', href }
      case 'roles':
        return { kind: 'surface', surface: 'management.roles', params: {} }
      case 'document-types':
        return { kind: 'surface', surface: 'management.documentTypes', params: {} }
      case 'forms':
        return { kind: 'surface', surface: 'shared.forms', params: {} }
      case 'templates':
        return { kind: 'surface', surface: 'shared.templates', params: {} }
      case 'import':
        return { kind: 'surface', surface: 'shared.import', params: {} }
      case 'pages':
        if (third === 'edit') return { kind: 'surface', surface: 'shared.pageEdit', params: { recordId: idOf(second) ?? undefined } }
        return { kind: 'external', href }
      case 'customize':
        return { kind: 'surface', surface: 'shared.siteStudio', params: {} }
      case 'records-new':
      case 'new':
        return { kind: 'external', href }
      default:
        return { kind: 'external', href }
    }
  }
}
