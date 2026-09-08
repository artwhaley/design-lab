import type { Lifecycle } from './lifecycle'

export const LIFECYCLE_STAGES: readonly Lifecycle[] = ['draft', 'submitted', 'filed', 'deprecated']
export const LIFECYCLE_STAGE_LABELS: Record<Lifecycle, string> = { draft: 'Draft', submitted: 'Submitted', filed: 'Filed', deprecated: 'Deprecated' }
export type LifecycleStageRowShape = { id?: number | string; documentType?: unknown; stage?: unknown; enabled?: unknown; allowOnCreation?: unknown; folder?: unknown; privateDraftsAllowed?: unknown; readRoles?: unknown; writeRoles?: unknown; editOthersRoles?: unknown; manageRoles?: unknown }
export function stageEnabled(row: LifecycleStageRowShape | null | undefined): boolean { return Boolean(row?.enabled) }
export function stageFolderId(row: LifecycleStageRowShape | null | undefined): number | null {
  const value = row?.folder
  return value && typeof value === 'object' && 'id' in value ? Number((value as { id: number | string }).id) : value == null || value === '' ? null : Number(value)
}
export function stageRoleIds(row: LifecycleStageRowShape | null | undefined, field: 'readRoles' | 'writeRoles' | 'editOthersRoles' | 'manageRoles'): number[] {
  const raw = row?.[field]
  const values = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : [raw]
  return values.map((value) => value && typeof value === 'object' && 'id' in value ? Number((value as { id: number | string }).id) : Number(value)).filter(Number.isFinite)
}
