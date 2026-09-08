import type { LabRuntimeFlags } from '../host/LabApp'
import type { SurfaceKey } from '../contracts'
import type { ScenarioSpec } from '../fixtures'
import type { FakeBackendSnapshot } from '../workspaces'
import type { SurfaceParams } from '../host/PathSimulator'

export const PREVIEW_PROTOCOL_VERSION = 1 as const

type ProtocolEnvelope = {
  protocol: typeof PREVIEW_PROTOCOL_VERSION
  instanceId: string
}

export type PreviewState = {
  designKey: string
  surface: SurfaceKey
  params: SurfaceParams
  viaCompat?: 'review' | 'subdomains'
  scenario: ScenarioSpec
  flags: LabRuntimeFlags
  config: {
    raw: unknown
    savedVersion: number | null
  }
  backendSnapshot: FakeBackendSnapshot
}

export type PreviewInitMessage = ProtocolEnvelope & {
  type: 'preview:init'
} & PreviewState

export type PreviewUpdateMessage = ProtocolEnvelope & {
  type: 'preview:update'
} & PreviewState

export type PreviewHydrateBackendMessage = ProtocolEnvelope & {
  type: 'preview:hydrate-backend'
  snapshot: FakeBackendSnapshot
  sourceInstanceId: string
}

export type PreviewResetMessage = ProtocolEnvelope & {
  type: 'preview:reset'
}

export type HostToPreviewMessage =
  | PreviewInitMessage
  | PreviewUpdateMessage
  | PreviewHydrateBackendMessage
  | PreviewResetMessage

export type PreviewReadyMessage = ProtocolEnvelope & {
  type: 'preview:ready'
}

export type PreviewNavigateMessage = ProtocolEnvelope & {
  type: 'preview:navigate'
  href: string
}

export type PreviewExternalMessage = ProtocolEnvelope & {
  type: 'preview:external'
  href: string
}

export type PreviewLogMessage = ProtocolEnvelope & {
  type: 'preview:log'
  entry: {
    scope: string
    action: string
    detail: string
    level: 'info' | 'error'
  }
}

export type PreviewBackendSnapshotMessage = ProtocolEnvelope & {
  type: 'preview:backend-snapshot'
  snapshot: FakeBackendSnapshot
  localRevision: number
}

export type PreviewErrorMessage = ProtocolEnvelope & {
  type: 'preview:error'
  message: string
}

export type PreviewToHostMessage =
  | PreviewReadyMessage
  | PreviewNavigateMessage
  | PreviewExternalMessage
  | PreviewLogMessage
  | PreviewBackendSnapshotMessage
  | PreviewErrorMessage

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const isNullableNumber = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value))
const isSurfaceKey = (value: unknown): value is SurfaceKey => (
  value === 'home' || value === 'records' || value === 'document' || value === 'departments' || value === 'department' ||
  value === 'about' || value === 'lore' || value === 'members' || value === 'member' || value === 'work' ||
  value === 'management.departments' || value === 'management.folders' || value === 'management.roles' ||
  value === 'management.documentTypes' || value === 'management.people' || value === 'management.person' ||
  value === 'management.invitations' || value === 'shared.forms' || value === 'shared.templates' || value === 'shared.import' ||
  value === 'shared.documentEdit' || value === 'shared.documentHistory' || value === 'shared.pageEdit' ||
  value === 'shared.siteStudio' || value === 'compat.review' || value === 'compat.subdomains' || value === 'external'
)

function isSurfaceParams(value: unknown): value is SurfaceParams {
  if (!isRecord(value)) return false
  const known = ['recordId', 'characterId', 'folderId']
  for (const key of known) {
    if (key in value && !isNullableNumber(value[key])) return false
  }
  for (const key of ['departmentSlug', 'loreSlug']) {
    if (key in value && !isString(value[key])) return false
  }
  return true
}

function isScenarioSpec(value: unknown): value is ScenarioSpec {
  if (!isRecord(value)) return false
  return (value.persona === 'visitor' || value.persona === 'member' || value.persona === 'departmentManager' || value.persona === 'admin') &&
    (value.dataState === 'populated' || value.dataState === 'empty' || value.dataState === 'stress') &&
    (value.fixtureProfile === undefined || value.fixtureProfile === 'default' || value.fixtureProfile === 'obsidian-fidelity')
}

function isRuntimeFlags(value: unknown): value is LabRuntimeFlags {
  if (!isRecord(value)) return false
  return typeof value.latencyMs === 'number' && Number.isFinite(value.latencyMs) &&
    typeof value.failNextMutation === 'boolean' && typeof value.readError === 'boolean' && typeof value.loadingOverride === 'boolean'
}

function isBackendSnapshot(value: unknown): value is FakeBackendSnapshot {
  if (!isRecord(value) || !isRecord(value.universe)) return false
  const universe = value.universe
  if (!isRecord(universe.domain)) return false
  const universeArrays = ['departments', 'members', 'roles', 'folders', 'documentTypes', 'records', 'lore', 'invitations', 'joinRequests', 'claimRequests', 'claimTargets', 'supersessionEdges']
  if (!universeArrays.every((key) => Array.isArray(universe[key]))) return false
  return typeof value.revision === 'number' && Number.isInteger(value.revision) && value.revision >= 0
}

function isPreviewState(value: Record<string, unknown>): value is Record<string, unknown> & PreviewState {
  const config = value.config
  return isString(value.designKey) && isSurfaceKey(value.surface) && isSurfaceParams(value.params) &&
    (value.viaCompat === undefined || value.viaCompat === 'review' || value.viaCompat === 'subdomains') &&
    isScenarioSpec(value.scenario) && isRuntimeFlags(value.flags) && isRecord(config) &&
    'raw' in config && isNullableNumber(config.savedVersion) && isBackendSnapshot(value.backendSnapshot)
}

function isEnvelope(value: unknown): value is Record<string, unknown> & ProtocolEnvelope {
  return isRecord(value) && value.protocol === PREVIEW_PROTOCOL_VERSION && isString(value.instanceId) && value.instanceId.length > 0 && isString(value.type)
}

export function isHostToPreviewMessage(value: unknown): value is HostToPreviewMessage {
  if (!isEnvelope(value)) return false
  switch (value.type) {
    case 'preview:init':
    case 'preview:update':
      return isPreviewState(value)
    case 'preview:hydrate-backend':
      return isBackendSnapshot(value.snapshot) && isString(value.sourceInstanceId) && value.sourceInstanceId.length > 0
    case 'preview:reset':
      return true
    default:
      return false
  }
}

export function isPreviewToHostMessage(value: unknown): value is PreviewToHostMessage {
  if (!isEnvelope(value)) return false
  switch (value.type) {
    case 'preview:ready':
      return true
    case 'preview:navigate':
    case 'preview:external':
      return isString(value.href) && value.href.length > 0
    case 'preview:log':
      return isRecord(value.entry) && isString(value.entry.scope) && isString(value.entry.action) && isString(value.entry.detail) &&
        (value.entry.level === 'info' || value.entry.level === 'error')
    case 'preview:backend-snapshot':
      return isBackendSnapshot(value.snapshot) && typeof value.localRevision === 'number' && Number.isInteger(value.localRevision) && value.localRevision >= 0
    case 'preview:error':
      return isString(value.message) && value.message.length > 0
    default:
      return false
  }
}

export function postPreviewMessage(message: PreviewToHostMessage): void {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage(message, window.location.origin)
  }
}
