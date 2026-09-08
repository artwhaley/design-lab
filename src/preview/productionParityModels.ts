import type { SurfaceKey } from '../contracts'
import type { DomainShellModel } from '@/lib/page-models/shell'
import type { HomePageModel } from '@/lib/page-models/home'
import type { RecordsPageModel } from '@/lib/page-models/records'
import type { DocumentPageModel } from '@/lib/page-models/document'
import type { AboutPageModel, LorePageModel } from '@/lib/page-models/info'
import type { DepartmentPageModel, DepartmentsPageModel } from '@/lib/page-models/departments'
import type { MembersPageModel } from '@/lib/page-models/members'
import type { DepartmentsManagementPageModel } from '@/lib/page-models/management/departments'
import type { FolderManagementPageModel } from '@/lib/page-models/management/folders'
import type { RoleManagementPageModel } from '@/lib/page-models/management/roles'
import type { DocumentTypesManagementPageModel } from '@/lib/page-models/management/documentTypes'
import type { PeopleManagementPageModel, PersonManagementPageModel } from '@/lib/page-models/management/people'
import type { InvitationsManagementPageModel } from '@/lib/page-models/management/invitations'
import type { WorkPageModel } from '@/lib/page-models/management/work'
import {
  ABOUT_PREVIEW_MODEL,
  DEPARTMENT_PREVIEW_MODEL,
  DEPARTMENTS_MANAGEMENT_MODEL,
  DEPARTMENTS_PREVIEW_MODEL,
  DOCUMENT_PREVIEW_MODEL,
  DOCUMENT_TYPES_MANAGEMENT_MODEL,
  FOLDERS_MANAGEMENT_MODEL,
  HOME_PREVIEW_MODEL,
  INVITATIONS_MANAGEMENT_MODEL,
  LORE_PREVIEW_MODEL,
  MEMBERS_MANAGEMENT_MODEL,
  PEOPLE_MANAGEMENT_MODEL,
  PERSON_MANAGEMENT_MODEL,
  RECORDS_PREVIEW_MODEL,
  ROLES_MANAGEMENT_MODEL,
  SHELL_PREVIEW_MODEL,
  WORK_MANAGEMENT_MODEL,
} from '@/lib/design/fixtures'

export const PRODUCTION_PARITY_BASE = '/design-parity'

export function productionParityPath(surface: SurfaceKey): string {
  const surfaceName = surface.replace('.', '-').replace('documentTypes', 'document-types')
  return surface === 'home' ? PRODUCTION_PARITY_BASE : `${PRODUCTION_PARITY_BASE}/${surfaceName}`
}

type ParityModel =
  | DomainShellModel
  | HomePageModel
  | RecordsPageModel
  | DocumentPageModel
  | AboutPageModel
  | LorePageModel
  | DepartmentPageModel
  | DepartmentsPageModel
  | MembersPageModel
  | DepartmentsManagementPageModel
  | FolderManagementPageModel
  | RoleManagementPageModel
  | DocumentTypesManagementPageModel
  | PeopleManagementPageModel
  | PersonManagementPageModel
  | InvitationsManagementPageModel
  | WorkPageModel

/** Keep fixture links and route facts equal to the production parity route. */
export function productionParityModel<T extends ParityModel>(model: T): T {
  const serialized = JSON.stringify(model).replaceAll('/domain/preview-domain', PRODUCTION_PARITY_BASE)
  return JSON.parse(serialized) as T
}

export function productionParityShellModel(): DomainShellModel {
  return productionParityModel(SHELL_PREVIEW_MODEL)
}

export function productionParityPageModel(surface: SurfaceKey): ParityModel | null {
  switch (surface) {
    case 'home': return productionParityModel(HOME_PREVIEW_MODEL)
    case 'records': return productionParityModel(RECORDS_PREVIEW_MODEL)
    case 'document': return productionParityModel(DOCUMENT_PREVIEW_MODEL)
    case 'departments': return productionParityModel(DEPARTMENTS_PREVIEW_MODEL)
    case 'department': return productionParityModel(DEPARTMENT_PREVIEW_MODEL)
    case 'about': return productionParityModel(ABOUT_PREVIEW_MODEL)
    case 'lore': return productionParityModel(LORE_PREVIEW_MODEL)
    case 'members': return productionParityModel(MEMBERS_MANAGEMENT_MODEL)
    case 'work': return productionParityModel(WORK_MANAGEMENT_MODEL)
    case 'management.departments': return productionParityModel(DEPARTMENTS_MANAGEMENT_MODEL)
    case 'management.folders': return productionParityModel(FOLDERS_MANAGEMENT_MODEL)
    case 'management.roles': return productionParityModel(ROLES_MANAGEMENT_MODEL)
    case 'management.documentTypes': return productionParityModel(DOCUMENT_TYPES_MANAGEMENT_MODEL)
    case 'management.people': return productionParityModel(PEOPLE_MANAGEMENT_MODEL)
    case 'management.person': return productionParityModel(PERSON_MANAGEMENT_MODEL)
    case 'management.invitations': return productionParityModel(INVITATIONS_MANAGEMENT_MODEL)
    default: return null
  }
}

export function productionParityInput(surface: SurfaceKey, theme: Record<string, string>, config: unknown): Record<string, unknown> {
  const surfaceName = surface.replace('.', '-').replace('documentTypes', 'document-types')
  return {
    fixtureSource: 'production/src/lib/design/fixtures.ts',
    surface: surfaceName,
    surfaceKey: surface,
    pathname: productionParityPath(surface),
    shell: productionParityShellModel(),
    page: productionParityPageModel(surface),
    config,
    theme,
  }
}
