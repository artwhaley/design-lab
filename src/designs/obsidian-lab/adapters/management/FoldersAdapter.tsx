import { useState } from 'react'
import type { FoldersManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { Modal } from '../../source/controls'
import { ObsidianFolderManager as SourceObsidianFolderManager } from '../../source/ObsidianFolderManager'
import { mapManagedFolderNodes } from '../sourceMappers'

function flatten<T extends { id: number; name: string; children: T[] }>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

export function FoldersAdapter({ model, workspace }: FoldersManagementPageProps<ObsidianConfig>) {
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null)
  const [moveOpen, setMoveOpen] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const [targetParentId, setTargetParentId] = useState<number | null>(null)
  const allNodes = flatten(workspace.nodes)
  const selectedId = selectedName ? allNodes.find((node) => node.name === selectedName)?.id ?? null : workspace.selectedId
  const selected = allNodes.find((node) => node.id === selectedId) ?? null

  const selectFromRow = (event: React.MouseEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest('[class*="arboristRow"]')
    const name = row?.querySelector('[class*="treeName"]')?.textContent?.trim()
    if (name) {
      setSelectedName(name)
      const node = allNodes.find((item) => item.name === name)
      workspace.select(node?.id ?? null)
    }
  }

  const handleAction = (label: string) => {
    if (label === 'New folder' || label === 'New subfolder') {
      if (!workspace.canCreateRoot) return
      setParentId(label === 'New subfolder' ? selectedId : null)
      setDraftName('')
      setDialog('create')
      return
    }
    if (label.startsWith('Rename folder:')) {
      if (!selected) return
      setDraftName(selected.name)
      setDialog('rename')
      return
    }
    if (label.startsWith('Delete folder:')) {
      if (selected && !selected.systemManaged) void workspace.deleteFolder(selected.id)
      return
    }
    if (label === 'Move folder' || label.startsWith('Move folder:') || label === 'Move folder preview') {
      if (selected && !selected.systemManaged) setMoveOpen(true)
    }
  }

  const submitDialog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draftName.trim()
    if (name.length < 2) return
    if (dialog === 'create') await workspace.createFolder(parentId, name)
    if (dialog === 'rename' && selected) await workspace.renameFolder(selected.id, name)
    setDialog(null)
  }

  const moveSelected = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected) await workspace.moveFolder(selected.id, targetParentId)
    setMoveOpen(false)
  }

  return (
    <>
      <div onClickCapture={selectFromRow} onChangeCapture={(event) => {
        const input = event.target as HTMLInputElement
        if (input.getAttribute('aria-label') === 'Search folders') workspace.setSearch(input.value)
      }}>
        <SourceObsidianFolderManager folders={mapManagedFolderNodes(model)} onAction={handleAction} />
      </div>
      {dialog && (
        <Modal open onOpenChange={(open) => { if (!open) setDialog(null) }} title={dialog === 'rename' ? 'Rename folder' : 'Create folder'} description="Folder name">
          <form onSubmit={(event) => void submitDialog(event)}>
            <label>Name <input aria-label="Folder name" value={draftName} onChange={(event) => setDraftName(event.target.value)} autoFocus /></label>
            <button type="submit">{dialog === 'rename' ? 'Rename' : 'Create'}</button>
          </form>
        </Modal>
      )}
      {moveOpen && selected && (
        <Modal open onOpenChange={(open) => { if (!open) setMoveOpen(false) }} title="Move folder" description={`Move “${selected.name}” to another collection.`}>
          <form onSubmit={(event) => void moveSelected(event)}>
            <label>
              Parent folder
              <select value={targetParentId ?? ''} onChange={(event) => setTargetParentId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">Root</option>
                {allNodes.filter((node) => node.id !== selected.id).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
              </select>
            </label>
            <button type="submit">Move folder</button>
          </form>
        </Modal>
      )}
    </>
  )
}
