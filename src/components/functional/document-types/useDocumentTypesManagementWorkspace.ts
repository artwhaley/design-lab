import { useMemo, useState } from 'react'
import type { DocumentTypesManagementPageModel } from '@/lib/page-models/management/documentTypes'
import type { TypeTreeData, TypeTreeLeaf } from '@/lib/documents/typeTree'

export type TypeFolderOption = { id: number; name: string; departmentId: number | null; depth: number }
export function flattenTypeFolders(nodes: TypeTreeData['roots'], depth = 0): TypeFolderOption[] {
  return nodes.flatMap((node) => node.kind === 'folder'
    ? [{ id: Number(node.id.slice('fld-'.length)), name: node.name, departmentId: node.departmentId ?? null, depth }, ...flattenTypeFolders(node.children, depth + 1)]
    : flattenTypeFolders(node.children, depth))
}

export function useDocumentTypesManagementWorkspace(model: DocumentTypesManagementPageModel) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const selectedLeaf = useMemo(() => model.tree.types.find((type) => type.id === selectedTypeId) ?? null, [model.tree.types, selectedTypeId])
  const typeFolders = useMemo(() => flattenTypeFolders(model.tree.roots), [model.tree.roots])
  return {
    selectedTypeId, setSelectedTypeId, creating, selectedLeaf, typeFolders,
    selectType: (id: number | null) => { setSelectedTypeId(id); setCreating(false) },
    beginCreate: () => { setSelectedTypeId(null); setCreating(true) },
    finishCreate: (id: number) => { setSelectedTypeId(id); setCreating(false) },
    cancelCreate: () => setCreating(false),
  }
}
export type { TypeTreeLeaf }
