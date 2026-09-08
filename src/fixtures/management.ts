/** Invitation/request source entities. Capabilities are explicit per scenario; no inference. */
export type InvitationEntity = {
  id: number
  purpose: string
  targetLabel: string
  issuedByLabel: string | null
  expiresLabel: string
  useLabel: string
  statusLabel: string
  canRevoke: boolean
}

export type JoinRequestEntity = {
  id: number
  applicantLabel: string
  characterLabel: string
  requestedAt: string
}

export type ClaimRequestEntity = {
  id: number
  characterLabel: string
  claimantLabel: string
  requestedAt: string
}

export const INVITATIONS: readonly InvitationEntity[] = [
  { id: 1, purpose: 'Registry clerk onboarding', targetLabel: 'kepler-exchange@example.test', issuedByLabel: 'Priya Chandrasekhar', expiresLabel: 'Expires 2026-04-01', useLabel: '1 of 5 uses', statusLabel: 'Active', canRevoke: true },
  { id: 2, purpose: 'Xenology field rotation', targetLabel: 'h.mori@example.test', issuedByLabel: 'Amara Okonkwo', expiresLabel: 'Expires 2026-03-15', useLabel: 'Unused', statusLabel: 'Active', canRevoke: true },
  { id: 3, purpose: 'Guest scholar access', targetLabel: 't.lindgren@example.test', issuedByLabel: 'Esmé Laurent', expiresLabel: 'Expired 2026-01-30', useLabel: '3 of 3 uses', statusLabel: 'Expired', canRevoke: false },
  { id: 4, purpose: 'Surveyor candidate review', targetLabel: 'pending-review@example.test', issuedByLabel: 'Ilyas Vance', expiresLabel: 'Expires 2026-05-01', useLabel: '0 of 10 uses', statusLabel: 'Active', canRevoke: true },
  { id: 5, purpose: 'Historian liaison', targetLabel: 'c.mctavish@example.test', issuedByLabel: 'Esmé Laurent', expiresLabel: 'Expires 2026-02-28', useLabel: '1 of 1 uses', statusLabel: 'Active', canRevoke: true },
]

export const JOIN_REQUESTS: readonly JoinRequestEntity[] = [
  { id: 1, applicantLabel: 'Nadia Flores', characterLabel: 'New Character: Nadia Flores', requestedAt: '2026-02-10T09:00:00.000Z' },
  { id: 2, applicantLabel: 'Omar Jansen', characterLabel: 'New Character: Omar Jansen', requestedAt: '2026-02-14T09:00:00.000Z' },
]

export const CLAIM_REQUESTS: readonly ClaimRequestEntity[] = [
  { id: 1, characterLabel: 'Apprentice Rhea Sorn', claimantLabel: 'rhea.sorn@example.test', requestedAt: '2026-02-12T09:00:00.000Z' },
  { id: 2, characterLabel: 'Courier Wes Callahan', claimantLabel: 'wes.c@example.test', requestedAt: '2026-02-16T09:00:00.000Z' },
]

/** Claimable Character targets for the issue panels (admin-only). */
export const CLAIM_TARGETS = [
  { id: 21, name: 'Apprentice Rhea Sorn' },
  { id: 22, name: 'Courier Wes Callahan' },
  { id: 23, name: 'Retired Fleet Archivist Odessa Kane' },
  { id: 24, name: 'Guest Scholar Tova Lindgren' },
]