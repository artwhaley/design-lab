/**
 * Authorized API seam coverage — closes the F5 gap: a Design may reference
 * only the documented mutation/query endpoints, and every one of them must be
 * served by the Lab's production action emulator so a Design's mutations
 * behave identically in preview. If this test fails, either a new endpoint
 * was added to the seam (extend the emulator) or the emulator regressed.
 */
import { afterEach, describe, expect, it } from 'vitest'

import { buildScenario } from '../fixtures'
import { installProductionActionEmulator } from '../preview/actionApiEmulator'
import { ActionLog, FakeBackend } from '../workspaces'

const SEAM = [
  { path: '/api/folders', body: { action: 'list' } },
  { path: '/api/departments', body: { name: 'Seam Check Department' } },
  { path: '/api/role-assignments', body: { roleId: '1', characterId: '1', action: 'add' } },
  { path: '/api/character-claims', body: { claimId: '1', decision: 'denied' } },
  { path: '/api/invitations/revoke', body: { invitationId: '1' } },
  { path: '/api/invitations/join-decision', body: { requestId: '1', decision: 'denied' } },
]

let uninstall: (() => void) | null = null
afterEach(() => {
  uninstall?.()
  uninstall = null
})

describe('authorized API seam is emulated', () => {
  it('every documented POST endpoint is recognized (no Unknown endpoint error)', async () => {
    const backend = new FakeBackend(buildScenario({ persona: 'admin', dataState: 'populated' }), new ActionLog(), 0)
    const errors: string[] = []
    uninstall = installProductionActionEmulator(backend, (error) => errors.push(error.message))

    for (const { path, body } of SEAM) {
      const form = new FormData()
      Object.entries(body).forEach(([key, value]) => form.set(key, value))
      const response = await fetch(path, { method: 'POST', body: form })
      expect(response.status, `POST ${path}`).toBeLessThan(500)
      const payload = await response.json() as { ok?: boolean; error?: string }
      // An unknown endpoint throws inside the emulator -> onError -> 400 with
      // the "Unknown production API endpoint" message. Invalid mutation input
      // (e.g. missing folderId) is legitimate per-endpoint validation and is
      // NOT a seam gap.
      expect(payload.error ?? '', `POST ${path}`).not.toContain('Unknown production API endpoint')
    }
    expect(errors.filter((message) => message.includes('Unknown production API endpoint'))).toEqual([])
  })

  it('GET /api/records-search serves the shared records workspace', async () => {
    const backend = new FakeBackend(buildScenario({ persona: 'admin', dataState: 'populated' }), new ActionLog(), 0)
    uninstall = installProductionActionEmulator(backend, () => {})
    const response = await fetch('/api/records-search?domainSlug=aster-reach&q=&subfolders=true&pageSize=12&sort=-updatedAt')
    expect(response.status).toBe(200)
    const data = await response.json() as { results: Array<{ id: number; title: string }>; supersessionEdges: unknown[]; nextCursor: string | null }
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)
    expect(data.results.length).toBeLessThanOrEqual(12)
  })

  it('unknown endpoints still fail loudly (seam is closed)', async () => {
    const backend = new FakeBackend(buildScenario({ persona: 'admin', dataState: 'populated' }), new ActionLog(), 0)
    const errors: string[] = []
    uninstall = installProductionActionEmulator(backend, (error) => errors.push(error.message))
    const form = new FormData()
    form.set('x', '1')
    const response = await fetch('/api/not-a-design-endpoint', { method: 'POST', body: form })
    expect(response.status).toBe(400)
    expect(errors.some((message) => message.includes('Unknown production API endpoint'))).toBe(true)
  })
})
