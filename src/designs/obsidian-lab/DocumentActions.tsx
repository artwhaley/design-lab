/**
 * Obsidian DocumentActions — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/DocumentActions.tsx),
 * adapted to the Lab DocumentActionBridge: the menu lists the supplied
 * ActionDescriptors; absent actions are never offered (Bible §54).
 */
import { MoreHorizontal } from 'lucide-react'
import type { ActionDescriptor } from '../../contracts'
import { ActionMenu, type Action } from './controls'

export function DocumentActions({
  actions,
  onRun,
}: {
  actions: ActionDescriptor[]
  onRun: (key: string) => void
}) {
  const items: Action[] = actions
    .filter((action) => action.state !== 'absent')
    .map((action) => ({
      key: action.key,
      label: action.label,
      disabled: action.state === 'disabled',
      danger: action.kind === 'destructive',
    }))
  if (items.length === 0) return null
  return (
    <ActionMenu
      label="Document actions"
      trigger={<><MoreHorizontal size={18} /> Actions</>}
      items={items}
      onAction={(action) => onRun(action.key)}
    />
  )
}