import type { FakeBackend, MutationResult } from '../workspaces'
import type { FolderSummary, RecordSummary } from '@/lib/page-models/common'
import { refreshPreview } from './navigation'
import type { LabProductionAction } from '@/lib/design/hostActionBridges'

type ActionResult = { ok: boolean; link?: string; error?: string; message?: string; typeId?: number }

function value(body: FormData, key: string): string {
  return String(body.get(key) ?? '')
}

function number(body: FormData, key: string): number {
  return Number(value(body, key))
}

function response(result: ActionResult, status = result.ok ? 200 : 403): Response {
  return new Response(JSON.stringify(result), { status, headers: { 'content-type': 'application/json' } })
}

function requireId(body: FormData, key: string): number {
  const id = number(body, key)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Lab action requires a positive integer ${key}.`)
  return id
}

function descendantFolderIds(nodes: FolderSummary[], matching: Set<number>): Set<number> {
  const out = new Set<number>()
  const visit = (folder: FolderSummary, inherited = false): void => {
    const selected = inherited || matching.has(folder.id)
    if (selected) out.add(folder.id)
    folder.children.forEach(child => visit(child, selected))
  }
  nodes.forEach(folder => visit(folder))
  return out
}

/**
 * Serve the shared Records workspace's read endpoint. `useRecordsWorkspace`
 * calls GET /api/records-search when a search is active; without this, every
 * Design's in-Lab search would 405 and silently return no server results.
 */
function searchRecords(backend: FakeBackend, url: URL): Response {
  const model = backend.builder.recordsModel()
  const q = (url.searchParams.get('q') ?? '').trim().toLocaleLowerCase()
  const folderParam = url.searchParams.get('folder')
  const typeParam = url.searchParams.get('type')
  const sort = url.searchParams.get('sort') ?? '-updatedAt'

  let selectedDescendants: Set<number> | null = null
  if (folderParam !== null) {
    const selected = new Set<number>([Number(folderParam)])
    selectedDescendants = url.searchParams.get('subfolders') === 'true' ? descendantFolderIds(model.folders, selected) : selected
  }

  const rows = model.records.filter((record) => {
    if (q && !record.title.toLocaleLowerCase().includes(q)) return false
    if (typeParam !== null && record.documentTypeId !== Number(typeParam)) return false
    if (selectedDescendants && !selectedDescendants.has(record.folderId ?? -1)) return false
    return true
  })
  rows.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title)
    if (sort === '-title') return b.title.localeCompare(a.title)
    if (sort === 'updatedAt') return String(a.updatedAt).localeCompare(String(b.updatedAt))
    return String(b.updatedAt).localeCompare(String(a.updatedAt))
  })

  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize')) || 50))
  const offset = Math.max(0, Number(url.searchParams.get('cursor')) || 0)
  const results: RecordSummary[] = rows.slice(offset, offset + pageSize).map((record) => ({
    id: record.id,
    title: record.title,
    folderId: record.folderId,
    documentTypeId: record.documentTypeId,
    updatedAt: record.updatedAt,
    preparedBy: record.preparedBy,
    lifecycle: record.lifecycle,
    locked: record.locked,
    capabilities: record.capabilities,
  }))
  return new Response(JSON.stringify({ results, supersessionEdges: model.supersessionEdges, nextCursor: offset + pageSize < rows.length ? String(offset + pageSize) : null }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function dispatchMutation(backend: FakeBackend, path: string, body: FormData): MutationResult {
  switch (path) {
    case '/api/permission-rules': {
      if (!backend.projection.canManageRoles) return { ok: false, error: 'Access denied.' }
      const principalType = value(body, 'principalType') || 'Character'
      const principalId = requireId(body, principalType === 'Role' ? 'roleId' : 'characterId')
      const typeResource = value(body, 'resourceType') === 'DocumentType'
      const resourceId = requireId(body, typeResource ? 'typeId' : 'folderId')
      const universe = backend.builder.universe
      if (!(principalType === 'Role' ? universe.roles : universe.members).some(row => row.id === principalId)) throw new Error('Unknown principal.')
      if (!(typeResource ? universe.documentTypes : universe.folders).some(row => row.id === resourceId)) throw new Error('Unknown resource.')
      const states = typeResource ? JSON.parse(value(body, 'capabilityStates')) : { readState: value(body, 'readState'), writeState: value(body, 'writeState') }
      if (!states || typeof states !== 'object' || Array.isArray(states) || Object.values(states).some(state => !['grant','deny','inherit'].includes(String(state)))) throw new Error('Invalid permission state.')
      universe.permissionRules ??= {}
      universe.permissionRules[`${principalType}:${principalId}:${typeResource ? 'DocumentType' : 'Folder'}:${resourceId}`] = states
      backend.log.append('permissions', 'save', `${principalType} ${principalId}`)
      return {ok:true}
    }
    case '/api/roles': {
      if (value(body, 'action') === 'delete') return backend.deleteRole(requireId(body, 'roleId'))
      const parentRoleId = value(body, 'parentRoleId') ? requireId(body, 'parentRoleId') : null
      const parent = backend.builder.universe.roles.find(role => role.id === parentRoleId)
      if (parentRoleId && !parent) throw new Error('Parent role not found.')
      return backend.createRole({ name: value(body, 'name'), departmentId: parent?.departmentId ?? requireId(body, 'subdomainId'), parentRoleId })
    }
    case '/api/folders': {
      const action = value(body, 'action')
      const id = action === 'create' ? null : requireId(body, 'folderId')
      if (action === 'create') {
        const parent = value(body, 'parentId')
        return backend.createFolder(parent ? Number(parent) : null, value(body, 'name'))
      }
      if (action === 'rename') return backend.renameFolder(id!, value(body, 'name'))
      if (action === 'delete') return backend.deleteFolder(id!)
      if (action === 'move') {
        const parent = value(body, 'parentId')
        return backend.moveFolder(id!, parent ? Number(parent) : null)
      }
      throw new Error(`Unsupported /api/folders action: ${action || '(missing)'}`)
    }
    case '/api/departments': {
      if (value(body, 'name')) return backend.createDepartment({ name: value(body, 'name'), description: value(body, 'description') })
      const action = value(body, 'action')
      const id = requireId(body, 'departmentId')
      if (action === 'archive') return backend.archiveDepartment(id)
      if (action === 'restore') return backend.restoreDepartment(id)
      throw new Error(`Unsupported /api/departments action: ${action || '(missing)'}`)
    }
    case '/api/role-assignments': {
      const roleId = requireId(body, 'roleId')
      requireId(body, 'characterId')
      const ids = body.getAll('characterId').map(Number)
      if (ids.some(id => !Number.isInteger(id) || id <= 0)) throw new Error('Invalid characterId.')
      if (['add', 'remove'].includes(value(body, 'action'))) {
        for (const id of ids) {
          const result = value(body, 'action') === 'add' ? backend.assignRole(roleId, id) : backend.unassignRole(roleId, id)
          if (!result.ok) return result
        }
        return { ok: true }
      }
      throw new Error(`Unsupported /api/role-assignments action: ${value(body, 'action') || '(missing)'}`)
    }
    case '/api/domain-memberships': {
      if (!(backend.projection.canOpenPeople && backend.projection.canManageRoles)) return { ok: false, error: 'Access denied.' }
      const characterId = requireId(body, 'characterId')
      const member = backend.builder.universe.members.find((candidate) => candidate.id === characterId)
      if (!member) throw new Error('Unknown character.')
      const action = value(body, 'action')
      if (action === 'remove') {
        member.status = 'inactive'
        member.roleIds = []
        member.departmentIds = []
      } else {
        // add / (no action): (re)activate Domain membership. Role and
        // department assignments start clean, matching production semantics.
        member.status = 'active'
        member.roleIds = []
        member.departmentIds = []
      }
      backend.log.append('memberships', action === 'remove' ? 'remove' : 'add', String(characterId))
      return { ok: true }
    }
    case '/api/invitations/revoke': return backend.revokeInvitation(requireId(body, 'invitationId'))
    case '/api/invitations/join-decision': {
      const id = requireId(body, 'requestId')
      return value(body, 'decision') === 'approved' ? backend.approveJoin(id) : backend.denyJoin(id)
    }
    case '/api/character-claims': {
      const id = requireId(body, 'claimId')
      return value(body, 'decision') === 'approved' ? backend.approveClaim(id) : backend.denyClaim(id)
    }
    default: throw new Error(`Unknown production API endpoint in Design Lab: ${path}`)
  }
}

export function installProductionActionEmulator(
  backend: FakeBackend,
  onError: (error: Error) => void,
  onMutation?: () => void,
): () => void {
  const originalFetch = window.fetch.bind(window)
  const globals = globalThis as typeof globalThis & { __loreforgeLabProductionAction?: (action: LabProductionAction) => Promise<ActionResult> }
  const originalHandler = globals.__loreforgeLabProductionAction

  const apply = async (path: string, body: FormData): Promise<Response> => {
    try {
      await backend.wait()
      if (backend.consumeFail()) return response({ ok: false, error: 'Simulated mutation failure.' }, 503)
      const result = dispatchMutation(backend, path, body)
      if (!result.ok) onError(new Error(result.error ?? 'Mutation failed.'))
      onMutation?.()
      refreshPreview()
      return response(result)
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error))
      onError(failure)
      return response({ ok: false, error: failure.message }, 400)
    }
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin)
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase()
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init)
    if (method === 'GET' && url.pathname === '/api/people-search') {
      if (backend.readError) return response({ ok: false, error: 'Simulated read failure.' }, 503)
      if (!backend.builder.managementPeopleModel().canOpenPeople) return response({ ok: false, error: 'Access denied.' }, 403)
      const results = backend.searchMembers(url.searchParams.get('q') ?? '').map(member => {
        const source = backend.builder.universe.members.find(candidate => candidate.id === member.id)!
        return { id: member.id, name: member.name, localName: source.displayName, controllerName: source.controllerName,
          roles: backend.builder.universe.roles.filter(role => source.roleIds.includes(role.id)).map(role => role.name),
          departments: backend.builder.universe.departments.filter(department => source.departmentIds.includes(department.id)).map(department => department.name) }
      })
      return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } })
    }
    if (method === 'GET' && url.pathname === '/api/records-search') {
      if (backend.readError) return response({ ok: false, error: 'Simulated read failure.' }, 503)
      return searchRecords(backend, url)
    }
    if (method !== 'POST') {
      const error = new Error(`Unsupported Lab API method ${method} ${url.pathname}`)
      onError(error)
      return response({ ok: false, error: error.message }, 405)
    }
    const body = init?.body instanceof FormData ? init.body : new FormData()
    return apply(url.pathname, body)
  }

  globals.__loreforgeLabProductionAction = async (action) => {
    if (action.kind === 'saveType') {
      const input = action.args
      if (!backend.projection.canManageDocumentTypes) return { ok: false, error: 'Access denied.' }
      if (backend.consumeFail()) return { ok: false, error: 'Simulated mutation failure.' }
      let type = backend.builder.universe.documentTypes.find(type => type.id === Number(input.typeId))
      if (input.typeId != null && !type) return { ok: false, error: 'Document Type not found.' }
      if (!type && !input.name?.trim()) return { ok: false, error: 'Name is required.' }
      if (input.departmentId != null && !backend.builder.universe.departments.some(department => department.id === input.departmentId && !department.archived)) return { ok: false, error: 'Choose an active Department.' }
      if (input.lifecycleStages && !input.lifecycleStages.some(stage => stage.enabled)) return { ok: false, error: 'Enable at least one lifecycle stage.' }
      if (!type) {
        const result = backend.createDocumentType({name:input.name!,departmentRootId:input.departmentId??null,templateMode:input.templateSelection==='form'?'form-to-markdown':input.templateSelection??'blank'})
        if (!result.ok) return result
        type=backend.builder.universe.documentTypes.at(-1)!
      }
      if (input.name !== undefined) type.name=input.name.trim()
      if (input.description !== undefined) type.description=input.description
      if (input.departmentId !== undefined) type.departmentRootId=input.departmentId
      if (input.typeFolderId !== undefined) type.parentFolderId=input.typeFolderId
      if (input.active !== undefined) type.archived=!input.active
      if (input.templateSelection !== undefined) type.templateMode=input.templateSelection==='form'?'form-to-markdown':input.templateSelection
      if (input.lifecycleStages) type.stageConfig=structuredClone(input.lifecycleStages)
      onMutation?.(); refreshPreview()
      return {ok:true,typeId:type.id}
    }
    if (action.kind === 'issueInvitation') {
      const body = action.formData
      const result = backend.createInvitation({ purpose: value(body, 'purpose'), targetLabel: value(body, 'characterId') || 'Domain participants' })
      onMutation?.()
      refreshPreview()
      return result.ok ? { ok: true, link: '/invitations/preview' } : result
    }
    if (action.kind === 'duplicateType') {
      const result = backend.duplicateDocumentType(Number(action.args.typeId))
      onMutation?.()
      refreshPreview()
      return result.ok ? { ...result, typeId: backend.builder.universe.documentTypes.at(-1)?.id } : result
    }
    const result = backend.setDocumentTypeArchived(Number(action.args.typeId), !action.args.active, action.args.active ? 'restore' : 'archive')
    onMutation?.()
    refreshPreview()
    return result
  }

  const onSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement | null
    if (!form) return
    const action = form.getAttribute('action')
    if (!action || !action.startsWith('/api/')) return
    event.preventDefault()
    void apply(new URL(action, window.location.origin).pathname, new FormData(form))
  }
  document.addEventListener('submit', onSubmit, true)

  return () => {
    window.fetch = originalFetch
    document.removeEventListener('submit', onSubmit, true)
    if (originalHandler) globals.__loreforgeLabProductionAction = originalHandler
    else delete globals.__loreforgeLabProductionAction
  }
}
