import { describe, expect, it } from 'vitest'

import { activeNavigationSegmentForSurface, canonicalPathForSurface, routeContextForSurface } from '../host/routeContext'

describe('generic Lab route context', () => {
  it('derives the Records segment for a document surface', () => {
    expect(routeContextForSurface('document', { recordId: 47 }).activeNavigationSegment).toBe('records')
  })

  it('derives the Departments segment for a department detail surface', () => {
    expect(routeContextForSurface('department', { departmentSlug: 'survey-cartography' }).activeNavigationSegment).toBe('departments')
  })

  it('maps review compatibility to Work without a design-specific branch', () => {
    expect(routeContextForSurface('work', {}, 'review')).toMatchObject({
      activeNavigationSegment: 'work',
      canonicalPath: '/domain/aster-reach/review',
      viaCompat: 'review',
    })
    expect(activeNavigationSegmentForSurface('compat.review')).toBe('work')
  })

  it('builds deterministic paths with route parameters', () => {
    expect(canonicalPathForSurface('document', { recordId: 47 })).toBe('/domain/aster-reach/documents/47')
    expect(canonicalPathForSurface('department', { departmentSlug: 'survey-cartography' })).toBe('/domain/aster-reach/departments/survey-cartography')
  })
})
