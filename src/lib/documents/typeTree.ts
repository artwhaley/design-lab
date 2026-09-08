export type TemplateSelection = 'blank' | 'markdown' | 'form'
export type TypeTreeLeaf = {
  id: number; name: string; description?: string | null; active: boolean; departmentId: number | null; typeFolderId: number | null
  templateSelection: TemplateSelection; templateId: number | null; templateName: string | null; templateKind: 'document' | 'form' | null
  constructedTemplates: { markdown: { id: number; name: string } | null; form: { id: number; name: string } | null }
}
export type TypeTreeNode = { id: string; kind: 'department' | 'unassigned' | 'folder' | 'type'; name: string; archived?: boolean; leaf?: TypeTreeLeaf; departmentId?: number | null; children: TypeTreeNode[] }
export type TypeTreeData = { roots: TypeTreeNode[]; hasUnassigned: boolean; departments: Array<{ id: number; name: string; archived: boolean }>; types: TypeTreeLeaf[] }
export type InspectorRole = { id: number; name: string; active: boolean }
export type InspectorFolderNode = { id: number; name: string; children: InspectorFolderNode[] }
