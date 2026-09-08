/**
 * Minimal observable base for fake workspaces. Workspaces are plain classes
 * (testable without React); the host subscribes through getVersion() with
 * useSyncExternalStore so state changes re-render the Design preview.
 */
export class WorkspaceBase {
  private listeners = new Set<() => void>()
  protected version = 0

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  getVersion = (): number => this.version

  protected emit(): void {
    this.version += 1
    for (const listener of [...this.listeners]) listener()
  }
}

/**
 * Base for fake workspaces that perform async reads and mutations against the
 * FakeBackend with the shared loading/error/pending runtime-state flags.
 */
export abstract class MutatingWorkspace extends WorkspaceBase {
  abstract readonly backend: import('./backend').FakeBackend

  protected loadingFlag = false
  protected errorMsg: string | null = null
  protected pendingKey: string | null = null

  get loading(): boolean {
    return this.loadingFlag || this.backend.loadingOverride
  }

  get error(): string | null {
    return this.errorMsg
  }

  get pending(): string | null {
    return this.pendingKey
  }

  /** Gates a mutation through the fake failure injection, then applies it. */
  protected async runMutation<T extends { ok: boolean; error?: string }>(
    scope: string,
    action: string,
    apply: () => T,
  ): Promise<T> {
    if (this.backend.consumeFail()) {
      this.pendingKey = null
      this.errorMsg = 'The last mutation failed (simulated).'
      this.backend.log.append(scope, action, 'failed (simulated)', 'error')
      this.emit()
      return { ok: false, error: 'The last mutation failed (simulated).' } as T
    }
    await this.backend.wait()
    const result = apply()
    this.pendingKey = null
    if (!result.ok) this.errorMsg = result.error ?? 'Operation failed.'
    this.emit()
    return result
  }

  protected beginMutation(key: string): void {
    this.pendingKey = key
    this.errorMsg = null
    this.emit()
  }

  protected beginRead(): void {
    this.loadingFlag = true
    this.errorMsg = null
    this.emit()
  }

  protected endRead(): void {
    this.loadingFlag = false
    this.emit()
  }
}