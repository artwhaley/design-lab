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