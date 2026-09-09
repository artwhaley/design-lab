import type { TypeInput } from '@/lib/actions/documentTypes'
export type IssueInvitationState = { ok: boolean; link?: string; error?: string; typeId?: number }

export type LabProductionAction =
  | { kind: 'saveType'; args: TypeInput }
  | { kind: 'issueInvitation'; formData: FormData }
  | { kind: 'duplicateType'; args: { domainSlug: string; typeId: number | string } }
  | { kind: 'setActiveType'; args: { domainSlug: string; typeId: number | string; active: boolean } }

type ActionGlobals = {
  __loreforgeLabProductionAction?: (action: LabProductionAction) => Promise<IssueInvitationState>
}

export function invokeLabAction(action: LabProductionAction): Promise<IssueInvitationState> {
  const handler = (globalThis as unknown as ActionGlobals).__loreforgeLabProductionAction
  return handler ? handler(action) : Promise.reject(new Error('Design Lab action transport is not installed.'))
}

export async function issueInvitationAction(_previous: IssueInvitationState, formData: FormData): Promise<IssueInvitationState> {
  return invokeLabAction({ kind: 'issueInvitation', formData })
}

export async function duplicateTypeAction(args: { domainSlug: string; typeId: number | string }): Promise<import('@/lib/actions/documentTypes').TypeTreeActionResult> {
  return invokeLabAction({ kind: 'duplicateType', args })
}

export async function setActiveTypeAction(args: { domainSlug: string; typeId: number | string; active: boolean }): Promise<import('@/lib/actions/documentTypes').TypeTreeActionResult> {
  return invokeLabAction({ kind: 'setActiveType', args })
}
