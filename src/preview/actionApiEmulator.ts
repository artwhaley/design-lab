import type { FakeBackend, MutationResult } from '../workspaces'
import { refreshPreview } from './navigation'
import type { LabProductionAction } from '@/lib/design/hostActionBridges'

type ActionResult = { ok: boolean; link?: string; error?: string; message?: string }

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

function dispatchMutation(backend: FakeBackend, path: string, body: FormData): MutationResult {
  switch (path) {
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
      const characterId = requireId(body, 'characterId')
      if (value(body, 'action') === 'add') return backend.assignRole(roleId, characterId)
      if (value(body, 'action') === 'remove') return backend.unassignRole(roleId, characterId)
      throw new Error(`Unsupported /api/role-assignments action: ${value(body, 'action') || '(missing)'}`)
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
      const result = dispatchMutation(backend, path, body)
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
    if (method !== 'POST') {
      const error = new Error(`Unsupported Lab API method ${method} ${url.pathname}`)
      onError(error)
      return response({ ok: false, error: error.message }, 405)
    }
    const body = init?.body instanceof FormData ? init.body : new FormData()
    return apply(url.pathname, body)
  }

  globals.__loreforgeLabProductionAction = async (action) => {
    if (action.kind === 'issueInvitation') {
      const body = action.formData
      const result = backend.createInvitation({ purpose: value(body, 'purpose'), targetLabel: value(body, 'characterId') || 'Domain participants' })
      onMutation?.()
      refreshPreview()
      return result.ok ? { ok: true, link: '/invitations/preview' } : result
    }
    if (action.kind === 'duplicateType') {
      const result = backend.duplicateDocumentType(action.args.typeId)
      onMutation?.()
      refreshPreview()
      return result
    }
    const result = backend.setDocumentTypeArchived(action.args.typeId, !action.args.active, action.args.active ? 'restore' : 'archive')
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
