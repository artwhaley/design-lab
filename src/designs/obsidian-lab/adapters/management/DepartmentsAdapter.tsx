import { useState } from 'react'
import type { DepartmentsManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { Modal } from '../../source/controls'
import { ObsidianManagement as SourceObsidianManagement } from '../../source/ObsidianManagement'
import type { ManagementPageModel as SourceManagementPageModel } from '../../source/contracts/management'
import s from '../../source/obsidian.module.css'

export function DepartmentsAdapter({ model, workspace }: DepartmentsManagementPageProps<ObsidianConfig>) {
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const selected = model.departments.find((department) => department.id === selectedId) ?? null
  const sourceModel: SourceManagementPageModel = {
    baseUrl: model.baseUrl,
    title: model.vocabulary.subdomainPlural,
    eyebrow: 'DOMAIN STRUCTURE',
    description: `Working groups and civic offices of ${model.domainName}.`,
    createLabel: `New ${model.vocabulary.subdomainSingular}`,
    searchPlaceholder: `Search ${model.vocabulary.subdomainPlural.toLowerCase()}`,
    columns: ['Name', 'Slug', 'Status'],
    rows: model.departments.map((department) => ({
      id: department.id,
      primary: department.name,
      secondary: department.slug,
      status: department.archived ? 'Archived' : 'Active',
    })),
    emptyLabel: `No ${model.vocabulary.subdomainPlural.toLowerCase()} match.`,
  }

  const onAction = (label: string) => {
    if (label === sourceModel.createLabel) {
      if (!model.canCreate) return
      setSelectedId(null)
      setName('')
      setDescription('')
      setDialog('create')
      return
    }
    const match = label.match(/^(Edit|Archive): (.+)$/)
    if (!match) return
    const department = model.departments.find((item) => item.name === match[2])
    if (!department) return
    setSelectedId(department.id)
    if (match[1] === 'Edit') {
      if (!department.canArchive && !department.canRestore) return
      setName(department.name)
      setDialog('rename')
    } else if (department.archived) {
      void workspace.restoreDepartment(department.id)
    } else if (department.canArchive) {
      void workspace.archiveDepartment(department.id)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    if (dialog === 'create') await workspace.createDepartment({ name: trimmed, description: description.trim() })
    if (dialog === 'rename' && selected) await workspace.renameDepartment(selected.id, trimmed)
    setDialog(null)
  }

  return (
    <>
      <SourceObsidianManagement model={sourceModel} onAction={onAction} />
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      {dialog && (
        <Modal open onOpenChange={(open) => { if (!open) setDialog(null) }} title={dialog === 'create' ? sourceModel.createLabel : 'Rename department'} description="Department details are used across the domain.">
          <form className={s.folderForm} onSubmit={(event) => void submit(event)}>
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} aria-label="Name" autoFocus /></label>
            {dialog === 'create' && <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Description" /></label>}
            <button type="submit" className={s.primaryButton}>{dialog === 'create' ? 'Create' : 'Rename'}</button>
          </form>
        </Modal>
      )}
    </>
  )
}
