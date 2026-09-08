/**
 * WorkWorkspaceImpl — fake Domain Work behavior (T05). Entries come from the
 * authorized Work projection; approve/return are supplied actions. The
 * /review compatibility surface resolves onto this same workspace.
 */
import type { WorkEntry, WorkPageModel, WorkWorkspace } from '../contracts'
import type { FakeBackend } from './backend'
import { MutatingWorkspace } from './base'

export class WorkWorkspaceImpl extends MutatingWorkspace implements WorkWorkspace {
  readonly backend: FakeBackend
  private onInspect: (href: string) => void

  constructor(backend: FakeBackend, _model: WorkPageModel, onInspect: (href: string) => void = () => undefined) {
    super()
    this.backend = backend
    this.onInspect = onInspect
  }

  private model(): WorkPageModel {
    return this.backend.builder.workModel()
  }

  get entries(): WorkEntry[] {
    return this.model().entries
  }

  inspect = (entryId: number): void => {
    const entry = this.entries.find((e) => e.id === entryId)
    if (!entry) return
    this.backend.log.append('work', 'inspect', `entry ${entryId}`)
    this.onInspect(entry.href)
  }

  async approve(entryId: number): Promise<void> {
    this.beginMutation('approve')
    await this.runMutation('work', 'approve', () => this.backend.approveWorkEntry(entryId))
  }

  async returnToDraft(entryId: number): Promise<void> {
    this.beginMutation('returnToDraft')
    await this.runMutation('work', 'return', () => this.backend.returnWorkEntry(entryId))
  }
}