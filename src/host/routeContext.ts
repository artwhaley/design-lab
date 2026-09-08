import type { LabRouteContext, SurfaceKey } from '../contracts'
import { surfaceByKey } from '../contracts'
import type { SurfaceParams } from './PathSimulator'

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/$/, '')

const segment = (value: string | number): string => encodeURIComponent(String(value))

export function activeNavigationSegmentForSurface(
  surface: SurfaceKey,
  viaCompat?: 'review' | 'subdomains',
): string | null {
  if (viaCompat === 'review' || surface === 'compat.review') return 'work'
  if (viaCompat === 'subdomains' || surface === 'compat.subdomains') return 'departments'
  return surfaceByKey(surface).navigationSegment ?? null
}

export function canonicalPathForSurface(
  surface: SurfaceKey,
  params: SurfaceParams = {},
  viaCompat?: 'review' | 'subdomains',
  baseUrl = '/domain/aster-reach',
): string {
  const base = normalizeBaseUrl(baseUrl)
  if (viaCompat === 'review' || surface === 'compat.review') return `${base}/review`
  if (viaCompat === 'subdomains' || surface === 'compat.subdomains') return `${base}/subdomains`

  switch (surface) {
    case 'home': return base
    case 'records': return params.folderId != null ? `${base}/records?folder=${segment(params.folderId)}` : `${base}/records`
    case 'document': return `${base}/documents/${segment(params.recordId ?? 1)}`
    case 'departments': return `${base}/departments`
    case 'department': return `${base}/departments/${segment(params.departmentSlug ?? 'high-council')}`
    case 'about': return `${base}/about`
    case 'lore': return params.loreSlug ? `${base}/lore/${segment(params.loreSlug)}` : `${base}/lore`
    case 'members': return `${base}/members`
    case 'work': return `${base}/work`
    case 'management.departments': return `${base}/manage/departments`
    case 'management.folders': return `${base}/manage/folders`
    case 'management.roles': return `${base}/roles`
    case 'management.documentTypes': return `${base}/document-types`
    case 'management.people': return `${base}/manage/people`
    case 'management.person': return `${base}/manage/people/${segment(params.characterId ?? 1)}`
    case 'management.invitations': return `${base}/manage/invitations`
    case 'shared.forms': return `${base}/forms`
    case 'shared.templates': return `${base}/templates`
    case 'shared.import': return `${base}/import`
    case 'shared.documentEdit': return `${base}/documents/${segment(params.recordId ?? 1)}/edit`
    case 'shared.documentHistory': return `${base}/documents/${segment(params.recordId ?? 1)}/history`
    case 'shared.pageEdit': return `${base}/pages/${segment(params.recordId ?? 'home')}/edit`
    case 'shared.siteStudio': return `${base}/customize`
    case 'external': return base
  }
}

export function routeContextForSurface(
  surface: SurfaceKey,
  params: SurfaceParams = {},
  viaCompat?: 'review' | 'subdomains',
  baseUrl = '/domain/aster-reach',
): LabRouteContext {
  return {
    surface,
    canonicalPath: canonicalPathForSurface(surface, params, viaCompat, baseUrl),
    activeNavigationSegment: activeNavigationSegmentForSurface(surface, viaCompat),
    ...(viaCompat ? { viaCompat } : {}),
  }
}
