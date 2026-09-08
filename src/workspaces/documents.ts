/**
 * DocumentActionBridgeImpl — the Document surface's supplied action bridge
 * (Bible §20). The Design never derives legal transitions from lifecycle
 * strings: every action is supplied here from the model's capability flags
 * plus the well-known production lifecycle gates. Clicking an action records
 * it in the Lab Action Log, optionally navigates (edit/history/supersede),
 * and mutates the in-memory fixture when the action is modeled.
 *
 * The action list recomputes from the CURRENT model, so a mutation such as
 * lock→unlock is reflected live without Design-side logic.
 */
import type { ActionDescriptor, DocumentActionResult, DocumentActionBridge, DocumentPageModel } from '../contracts'
import type { FakeBackend } from './backend'

export class DocumentActionBridgeImpl implements DocumentActionBridge {
  readonly recordId: number
  private onNavigate: (href: string) => void

  constructor(
    private readonly backend: FakeBackend,
    model: DocumentPageModel,
    onNavigate: (href: string) => void = () => undefined,
  ) {
    this.recordId = model.recordId
    this.onNavigate = onNavigate
  }

  private currentModel(): DocumentPageModel {
    return this.backend.builder.documentModel(this.recordId)
  }

  get actions(): ActionDescriptor[] {
    const model = this.currentModel()
    const caps = model.capabilities
    const d = (key: string, label: string, kind: ActionDescriptor['kind'], state: ActionDescriptor['state']): ActionDescriptor => ({ key, label, kind, state })
    return [
      d('view', 'View record', 'default', 'available'),
      d('edit', 'Edit', 'default', caps.edit ? 'available' : 'absent'),
      d('history', 'History', 'default', model.routes.historyUrl ? 'available' : 'absent'),
      d('submit', 'Submit', 'primary', caps.submit ? 'available' : 'absent'),
      d('file', 'File', 'primary', caps.file ? 'available' : 'absent'),
      d('approve', 'Approve', 'primary', caps.approve ? 'available' : 'absent'),
      d('return', 'Return to draft', 'default', caps.approve && model.lifecycle === 'submitted' ? 'available' : 'absent'),
      d('deprecate', 'Deprecate', 'default', caps.deprecate ? 'available' : 'absent'),
      d('restore', 'Restore', 'default', caps.restore ? 'available' : 'absent'),
      d('lock', 'Lock', 'default', caps.lock ? 'available' : 'absent'),
      d('unlock', 'Unlock', 'default', caps.unlock ? 'available' : 'absent'),
      d('supersede', 'Supersede', 'default', caps.supersede ? 'available' : 'absent'),
      d('delete', 'Delete', 'destructive', caps.delete ? 'available' : 'absent'),
    ]
  }

  async run(actionKey: string): Promise<DocumentActionResult> {
    const model = this.currentModel()
    const action = this.actions.find((a) => a.key === actionKey)
    if (!action || action.state !== 'available') {
      this.backend.log.append('document', actionKey, 'denied or unavailable', 'error')
      return { ok: false, message: `Action "${actionKey}" is not available.` }
    }

    // Simulated runtime failure gate (T07): next mutation fails.
    if (this.backend.consumeFail()) {
      this.backend.log.append('document', actionKey, 'failed (simulated)', 'error')
      return { ok: false, message: 'The action failed (simulated next-mutation failure).' }
    }
    await this.backend.wait(60)

    switch (actionKey) {
      case 'view':
        this.navigate(`${model.baseUrl}/documents/${model.recordId}`, 'view')
        return { ok: true, message: 'Navigated to record.' }
      case 'edit':
        this.navigate(model.routes.editUrl, 'edit')
        return { ok: true, message: 'Navigated to the document editor.' }
      case 'history':
        this.navigate(model.routes.historyUrl, 'history')
        return { ok: true, message: 'Navigated to document history.' }
      case 'supersede':
        this.navigate(model.routes.supersedeUrl, 'supersede')
        return { ok: true, message: 'Opened a new record superseding this one.' }
      case 'submit':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'submitted', 'submit'), 'Submitted for review.')
      case 'file':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'filed', 'file'), 'Filed.')
      case 'approve':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'filed', 'approve'), 'Approved and filed.')
      case 'return':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'draft', 'return'), 'Returned to draft.')
      case 'deprecate':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'deprecated', 'deprecate'), 'Deprecated.')
      case 'restore':
        return this.mutate(() => this.backend.setLifecycle(model.recordId, 'filed', 'restore'), 'Restored.')
      case 'lock':
        return this.mutate(() => this.backend.setLocked(model.recordId, true), 'Locked.')
      case 'unlock':
        return this.mutate(() => this.backend.setLocked(model.recordId, false), 'Unlocked.')
      case 'delete': {
        const result = this.backend.deleteRecord(model.recordId)
        if (result.ok) this.onNavigate(`${this.backend.builder.baseUrl}/records`)
        return result.ok
          ? { ok: true, message: result.message ?? 'Deleted.' }
          : { ok: false, message: result.error ?? 'Delete failed.' }
      }
      default:
        return { ok: false, message: `Unknown action "${actionKey}".` }
    }
  }

  private navigate(href: string | null, actionKey: string): void {
    this.backend.log.append('document', actionKey, `record ${this.recordId}`)
    if (href) this.onNavigate(href)
  }

  private mutate(apply: () => { ok: boolean; error?: string; message?: string }, fallback: string): DocumentActionResult {
    const result = apply()
    return result.ok
      ? { ok: true, message: result.message ?? fallback }
      : { ok: false, message: result.error ?? fallback }
  }
}