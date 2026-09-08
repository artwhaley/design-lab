import { useState } from 'react'
import type { FolderManagementNode, FolderManagementPageModel } from '@/lib/page-models/management/folders'

export type FolderDialog = 'create' | 'delete' | 'move' | null

export function useFolderManagementWorkspace(model: FolderManagementPageModel) {
  const [dialog, setDialog] = useState<FolderDialog>(null)
  const [target, setTarget] = useState<FolderManagementNode | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const post = async (fields: Record<string, string>) => {
    const body = new FormData()
    body.set('domainSlug', model.domainSlug)
    Object.entries(fields).forEach(([key, value]) => body.set(key, value))
    await fetch('/api/folders', { method: 'POST', body })
  }
  const run = async (fields: Record<string, string>) => {
    if (busy) return
    setBusy(true)
    try { await post(fields) } finally { setBusy(false) }
  }
  return {
    dialog, setDialog, target, setTarget, selectedIds, setSelectedIds, busy,
    canManageRoot: model.rootManageable,
    moveTargets: (_target: FolderManagementNode | null) => [] as Array<{ node: FolderManagementNode; depth: number }>,
    setSelected: setSelectedIds,
    setTargetNode: setTarget,
    createFolder: (name: string, parentId: number | null) => run({ action: 'create', name, parentId: parentId == null ? '' : String(parentId) }),
    renameFolder: (id: number, name: string) => run({ action: 'rename', folderId: String(id), name }),
    deleteFolder: (id: number) => run({ action: 'delete', folderId: String(id) }),
    moveFolder: (id: number, parentId: number | null) => run({ action: 'move', folderId: String(id), parentId: parentId == null ? '' : String(parentId) }),
    moveNodes: (moves: Array<{ id: number; parentId: number | null }>) => Promise.all(moves.map((move) => run({ action: 'move', folderId: String(move.id), parentId: move.parentId == null ? '' : String(move.parentId) }))),
  }
}
