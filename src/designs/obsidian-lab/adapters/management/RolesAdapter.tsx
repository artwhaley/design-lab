import { useState } from 'react'
import type { RolesManagementPageProps } from '../../../../contracts'
import type { ObsidianConfig } from '../../config'
import { Modal } from '../../source/controls'
import { ObsidianManagement as SourceObsidianManagement } from '../../source/ObsidianManagement'
import type { ManagementPageModel as SourceManagementPageModel } from '../../source/contracts/management'
import s from '../../source/obsidian.module.css'

export function RolesAdapter({ model, workspace }: RolesManagementPageProps<ObsidianConfig>) {
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(workspace.selectedRoleId)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState(model.departments[0]?.id ?? 1)
  const selected = model.roleRecords.find((role) => role.id === selectedId) ?? null
  const sourceModel: SourceManagementPageModel = {
    baseUrl: model.baseUrl,
    title: 'Roles',
    eyebrow: 'PERMISSIONS & HOLDERS',
    description: 'Roles carry folder and type permissions; people hold roles.',
    createLabel: workspace.canCreate ? 'New role' : 'Role directory',
    searchPlaceholder: 'Search roles',
    columns: ['Role', 'Department', 'Holders'],
    rows: model.roleRecords.map((role) => ({
      id: role.id,
      primary: role.name,
      secondary: `${model.departments.find((department) => department.id === role.departmentId)?.name ?? 'Unassigned'} · ${workspace.holdersByRole[String(role.id)]?.length ?? 0} holders`,
      status: role.parentRoleId === null ? 'Root role' : 'Inherited',
    })),
    emptyLabel: 'No roles match.',
  }

  const onAction = (label: string) => {
    if (label === sourceModel.createLabel) {
      if (!workspace.canCreate) return
      setName('')
      setDepartmentId(model.departments[0]?.id ?? 1)
      setDialog('create')
      return
    }
    const match = label.match(/^(Edit|Archive): (.+)$/)
    if (!match) return
    const role = model.roleRecords.find((item) => item.name === match[2])
    if (!role) return
    setSelectedId(role.id)
    workspace.selectRole(role.id)
    if (match[1] === 'Edit' && workspace.canEdit) {
      setName(role.name)
      setDialog('rename')
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    if (dialog === 'create') await workspace.createRole({ name: trimmed, departmentId })
    if (dialog === 'rename' && selected) await workspace.renameRole(selected.id, trimmed)
    setDialog(null)
  }

  return (
    <>
      <SourceObsidianManagement model={sourceModel} onAction={onAction} />
      {workspace.error && <p className={s.formError} role="alert">{workspace.error}</p>}
      {dialog && (
        <Modal open onOpenChange={(open) => { if (!open) setDialog(null) }} title={dialog === 'create' ? 'New role' : 'Rename role'} description="Role changes are applied by the Lab workspace.">
          <form className={s.folderForm} onSubmit={(event) => void submit(event)}>
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} aria-label="Role name" autoFocus /></label>
            {dialog === 'create' && (
              <label>Department<select value={departmentId} onChange={(event) => setDepartmentId(Number(event.target.value))}>{model.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            )}
            <button type="submit" className={s.primaryButton}>{dialog === 'create' ? 'Create' : 'Rename'}</button>
          </form>
        </Modal>
      )}
    </>
  )
}
