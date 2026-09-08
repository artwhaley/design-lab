/**
 * InvitationsManagementWorkspaceImpl — fake invitation/request management
 * (T05). All operations are capability-gated by the backend.
 */
import type { InvitationRow, InvitationsManagementPageModel, InvitationsManagementWorkspace, PendingClaimRequest, PendingJoinRequest } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

export class InvitationsManagementWorkspaceImpl extends MutatingWorkspace implements InvitationsManagementWorkspace {
  readonly backend: FakeBackend

  constructor(backend: FakeBackend, _model: InvitationsManagementPageModel) {
    super()
    this.backend = backend
  }

  private model(): InvitationsManagementPageModel {
    return this.backend.builder.managementInvitationsModel()
  }

  get canManage(): boolean {
    return this.model().canManage
  }

  get invitations(): InvitationRow[] {
    return this.model().invitations
  }

  get pendingJoins(): PendingJoinRequest[] {
    return this.model().pendingJoins
  }

  get pendingClaims(): PendingClaimRequest[] {
    return this.model().pendingClaims
  }

  async createInvitation(input: { purpose: string; targetLabel: string }): Promise<void> {
    this.beginMutation('createInvitation')
    await this.runMutation('invitations', 'create', () => this.backend.createInvitation(input))
  }

  async resendInvitation(id: number): Promise<void> {
    this.beginMutation('resendInvitation')
    await this.runMutation('invitations', 'resend', () => this.backend.resendInvitation(id))
  }

  async revokeInvitation(id: number): Promise<void> {
    this.beginMutation('revokeInvitation')
    await this.runMutation('invitations', 'revoke', () => this.backend.revokeInvitation(id))
  }

  async approveJoin(id: number): Promise<void> {
    this.beginMutation('approveJoin')
    await this.runMutation('invitations', 'approveJoin', () => this.backend.approveJoin(id))
  }

  async denyJoin(id: number): Promise<void> {
    this.beginMutation('denyJoin')
    await this.runMutation('invitations', 'denyJoin', () => this.backend.denyJoin(id))
  }

  async approveClaim(id: number): Promise<void> {
    this.beginMutation('approveClaim')
    await this.runMutation('invitations', 'approveClaim', () => this.backend.approveClaim(id))
  }

  async denyClaim(id: number): Promise<void> {
    this.beginMutation('denyClaim')
    await this.runMutation('invitations', 'denyClaim', () => this.backend.denyClaim(id))
  }
}