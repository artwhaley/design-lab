import { describe, expect, it } from 'vitest'

import { isHostToPreviewMessage, isPreviewToHostMessage, PREVIEW_PROTOCOL_VERSION } from '../preview/protocol'

const state = {
  designKey: 'stub-one',
  surface: 'home' as const,
  params: {},
  scenario: { persona: 'admin' as const, dataState: 'populated' as const },
  flags: { latencyMs: 0, failNextMutation: false, readError: false, loadingOverride: false },
  config: { raw: { accent: '#123456' }, savedVersion: null },
  backendSnapshot: {
    universe: {
      domain: {}, departments: [], members: [], roles: [], folders: [], documentTypes: [], records: [], lore: [],
      invitations: [], joinRequests: [], claimRequests: [], claimTargets: [], supersessionEdges: [],
    },
    revision: 0,
  },
}

describe('preview protocol guards', () => {
  it('accepts a complete typed init message', () => {
    expect(isHostToPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId: 'pane-a', type: 'preview:init', ...state })).toBe(true)
  })

  it('rejects wrong protocol versions and malformed state', () => {
    expect(isHostToPreviewMessage({ protocol: 99, instanceId: 'pane-a', type: 'preview:reset' })).toBe(false)
    expect(isHostToPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId: 'pane-a', type: 'preview:init', ...state, config: { savedVersion: null } })).toBe(false)
  })

  it('guards preview-to-host payloads without accepting arbitrary data', () => {
    expect(isPreviewToHostMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId: 'pane-a', type: 'preview:navigate', href: '/domain/aster-reach/records' })).toBe(true)
    expect(isPreviewToHostMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId: 'pane-a', type: 'preview:navigate', href: '' })).toBe(false)
    expect(isPreviewToHostMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId: 'pane-a', type: 'preview:error', message: 'render failed' })).toBe(true)
  })
})
