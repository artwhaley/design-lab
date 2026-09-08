import { useState } from 'react'
import type { DocumentTypesManagementPageProps } from '../../../../contracts'
import type { DocumentTypeTemplateMode } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { Modal } from '../../source/controls'
import { ObsidianDocumentTypes as SourceObsidianDocumentTypes } from '../../source/ObsidianDocumentTypes'
import { mapDocumentTypeNodes } from '../sourceMappers'

function findTypeId(nodes: ReturnType<typeof mapDocumentTypeNodes>, name: string): number | null {
  for (const node of nodes) {
    if (node.name === name && node.kind === 'type') return Number(node.id.replace('type:', ''))
    const child = findTypeId(node.children, name)
    if (child !== null) return child
  }
  return null
}

export function DocumentTypesAdapter({ model, workspace }: DocumentTypesManagementPageProps<ObsidianConfig>) {
  const [createOpen, setCreateOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const sourceNodes = mapDocumentTypeNodes(model.tree)
  const typeIdByName = (name: string) => findTypeId(sourceNodes, name)

  const selectFromRow = (event: React.MouseEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest('[class*="arboristRow"]')
    const name = row?.querySelector('[class*="treeName"]')?.textContent?.trim()
    const id = name ? typeIdByName(name) : null
    if (id !== null) workspace.select(id)
  }

  const handleAction = (label: string) => {
    if (label === 'New document type') {
      if (workspace.canManage) setCreateOpen(true)
      return
    }
    const rename = label.match(/^Rename type folder: (?:type:)?(\d+) → (.+)$/)
    if (rename) {
      const id = Number(rename[1])
      if (sourceNodes.some((node) => node.id === `type:${id}` && node.kind === 'type')) void workspace.renameType(id, rename[2])
      return
    }
    const action = label.match(/^(Duplicate|Deactivate|Delete|Configure type|Edit)(?:\:|\s)(.+)$/)
    if (!action) return
    const id = typeIdByName(action[2])
    if (id === null) return
    if (action[1] === 'Duplicate') void workspace.duplicateType(id)
    if (action[1] === 'Deactivate') void workspace.archiveType(id)
    // The frozen source offers Delete, but the Lab workspace intentionally
    // exposes archive/restore rather than destructive type deletion.
  }

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draftName.trim()
    if (name.length < 2) return
    await workspace.createType({ name, parentId, templateMode: 'blank' as DocumentTypeTemplateMode })
    setCreateOpen(false)
    setDraftName('')
  }

  return (
    <>
      <div onClickCapture={selectFromRow}>
        <SourceObsidianDocumentTypes nodes={sourceNodes} onAction={handleAction} />
      </div>
      {createOpen && (
        <Modal open onOpenChange={(open) => { if (!open) setCreateOpen(false) }} title="New document type" description="Create a document type in the Lab workspace.">
          <form onSubmit={(event) => void submitCreate(event)}>
            <label>Name <input aria-label="Document type name" value={draftName} onChange={(event) => setDraftName(event.target.value)} autoFocus /></label>
            <label>Department root <select value={parentId ?? ''} onChange={(event) => setParentId(event.target.value ? Number(event.target.value) : null)}><option value="">Unassigned</option>{model.tree.filter((node) => node.kind === 'department-root').map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label>
            <button type="submit">Create</button>
          </form>
        </Modal>
      )}
    </>
  )
}
