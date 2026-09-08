export type IssueInvitationState = { ok: boolean; link?: string; error?: string }

export type LabProductionAction =
  | { kind: 'issueInvitation'; formData: FormData }
  | { kind: 'duplicateType'; args: { domainSlug: string; typeId: number } }
  | { kind: 'setActiveType'; args: { domainSlug: string; typeId: number; active: boolean } }

type ActionGlobals = {
  __loreforgeLabProductionAction?: (action: LabProductionAction) => Promise<{ ok: boolean; link?: string; error?: string }>
}

function invokeLabAction(action: LabProductionAction): Promise<{ ok: boolean; link?: string; error?: string }> {
  const handler = (globalThis as unknown as ActionGlobals).__loreforgeLabProductionAction
  return handler ? handler(action) : Promise.resolve({ ok: true })
}

export async function issueInvitationAction(_previous: IssueInvitationState, formData: FormData): Promise<IssueInvitationState> {
  return invokeLabAction({ kind: 'issueInvitation', formData })
}

export async function duplicateTypeAction(args: { domainSlug: string; typeId: number }): Promise<{ ok: boolean }> {
  return invokeLabAction({ kind: 'duplicateType', args })
}

export async function setActiveTypeAction(args: { domainSlug: string; typeId: number; active: boolean }): Promise<{ ok: boolean }> {
  return invokeLabAction({ kind: 'setActiveType', args })
}
