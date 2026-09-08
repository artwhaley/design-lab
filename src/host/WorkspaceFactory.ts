/**
 * WorkspaceFactory — the host's fake-workspace adapter layer. For a given
 * surface and backend it creates the semantic workspace/action bridge the
 * Design receives. In compare mode each pane gets its own instances bound to
 * the SAME backend, so mutations through either pane update shared state.
 */
import type { ScenarioBuilder } from '../fixtures'
import type { FakeBackend } from '../workspaces'
import {
  DepartmentsManagementWorkspaceImpl,
  DocumentActionBridgeImpl,
  DocumentTypesManagementWorkspaceImpl,
  FoldersManagementWorkspaceImpl,
  InvitationsManagementWorkspaceImpl,
  PeopleManagementWorkspaceImpl,
  PersonManagementWorkspaceImpl,
  RecordsWorkspaceImpl,
  RolesManagementWorkspaceImpl,
  WorkWorkspaceImpl,
} from '../workspaces'
import type { SurfaceParams } from './PathSimulator'

export type PaneBridges = {
  records?: RecordsWorkspaceImpl
  document?: DocumentActionBridgeImpl
  work?: WorkWorkspaceImpl
  folders?: FoldersManagementWorkspaceImpl
  roles?: RolesManagementWorkspaceImpl
  documentTypes?: DocumentTypesManagementWorkspaceImpl
  people?: PeopleManagementWorkspaceImpl
  person?: PersonManagementWorkspaceImpl
  departments?: DepartmentsManagementWorkspaceImpl
  invitations?: InvitationsManagementWorkspaceImpl
}

export function createWorkspacesForSurface(
  backend: FakeBackend,
  builder: ScenarioBuilder,
  bridge: string | undefined,
  params: SurfaceParams,
  onNavigate: (href: string) => void,
): PaneBridges {
  const out: PaneBridges = {}
  switch (bridge) {
    case 'records':
      out.records = new RecordsWorkspaceImpl(backend, builder.recordsModel())
      break
    case 'document': {
      const recordId = params.recordId ?? builder.defaultRecordId()
      if (recordId !== null) out.document = new DocumentActionBridgeImpl(backend, builder.documentModel(recordId), onNavigate)
      break
    }
    case 'work':
      out.work = new WorkWorkspaceImpl(backend, builder.workModel(), onNavigate)
      break
    case 'folders':
      out.folders = new FoldersManagementWorkspaceImpl(backend, builder.managementFoldersModel())
      break
    case 'roles':
      out.roles = new RolesManagementWorkspaceImpl(backend, builder.managementRolesModel())
      break
    case 'documentTypes':
      out.documentTypes = new DocumentTypesManagementWorkspaceImpl(backend, builder.managementDocumentTypesModel())
      break
    case 'people':
      out.people = new PeopleManagementWorkspaceImpl(backend, builder.managementPeopleModel(), (characterId) => onNavigate(`${builder.baseUrl}/manage/people/${characterId}`))
      break
    case 'person': {
      const characterId = params.characterId ?? builder.defaultPersonCharacterId()
      if (characterId !== null) out.person = new PersonManagementWorkspaceImpl(backend, builder.managementPersonModel(characterId))
      break
    }
    case 'departments':
      out.departments = new DepartmentsManagementWorkspaceImpl(backend, builder.managementDepartmentsModel())
      break
    case 'invitations':
      out.invitations = new InvitationsManagementWorkspaceImpl(backend, builder.managementInvitationsModel())
      break
    default:
      break
  }
  return out
}