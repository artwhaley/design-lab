/**
 * <Name> pages — template skeleton.
 *
 * Every required Class-A slot exists here with its props typed against the
 * contract. Each stub renders an obvious "not implemented" surface; a copied
 * Design cannot be considered complete until every stub is replaced with a
 * real render of the supplied model. Interactive pages receive their fake
 * workspace (records/work/folders/roles/documentTypes/people/person/
 * departments/invitations) or the document action bridge as an explicit prop
 * — never the backend.
 *
 * Study src/designs/contract-probe/ for a complete reference implementation
 * of every slot.
 */
import type {
  AboutPageModel,
  DepartmentPageModel,
  DepartmentsManagementPageModel,
  DepartmentsManagementWorkspace,
  DepartmentsPageModel,
  DocumentActionBridge,
  DocumentPageModel,
  DocumentTypesManagementPageModel,
  DocumentTypesManagementWorkspace,
  FolderManagementPageModel,
  FoldersManagementWorkspace,
  HomePageModel,
  InvitationsManagementPageModel,
  InvitationsManagementWorkspace,
  LabPageProps,
  LorePageModel,
  MemberPageModel,
  MembersPageModel,
  PeopleManagementPageModel,
  PeopleManagementWorkspace,
  PersonManagementPageModel,
  PersonManagementWorkspace,
  RecordsPageModel,
  RecordsWorkspace,
  RoleManagementPageModel,
  RolesManagementWorkspace,
  WorkPageModel,
  WorkWorkspace,
} from '../../contracts'
import type { TemplateConfigV1 } from './config'

export function StubSurface(props: { surface: string; hint?: string }) {
  return (
    <div className="template-stub" data-stub-surface={props.surface}>
      <h2>{props.surface} — not implemented</h2>
      <p>Replace this stub with a real render of the supplied model.</p>
      {props.hint ? <p className="template-stub-hint">{props.hint}</p> : null}
    </div>
  )
}

type PageProps<TModel> = LabPageProps<TModel, TemplateConfigV1>

export const TemplateHome = ({ model }: PageProps<HomePageModel>) => <StubSurface surface="home" hint={`Model: welcome ${model.welcome.html ? 'has' : 'has no'} content; ${model.recentRecords.length} recent records.`} />
export const TemplateRecords = ({ model, workspace }: PageProps<RecordsPageModel> & { workspace: RecordsWorkspace }) => <StubSurface surface="records" hint={`${model.domainSlug}: ${workspace.results.total} records; ${workspace.folders.list.length} folder roots; search "${workspace.search.value}".`} />
export const TemplateDocument = ({ model, actions }: PageProps<DocumentPageModel> & { actions: DocumentActionBridge }) => <StubSurface surface="document" hint={`"${model.title}" (${model.lifecycle}); ${actions.actions.length} supplied actions.`} />
export const TemplateDepartments = ({ model }: PageProps<DepartmentsPageModel>) => <StubSurface surface="departments" hint={`${model.departments.length} departments.`} />
export const TemplateDepartment = ({ model }: PageProps<DepartmentPageModel>) => <StubSurface surface="department" hint={`${model.name}; ${model.members.length} members.`} />
export const TemplateAbout = ({ model }: PageProps<AboutPageModel>) => <StubSurface surface="about" hint={model.bodyHtml ? 'body present' : 'no body'} />
export const TemplateLore = ({ model }: PageProps<LorePageModel>) => <StubSurface surface="lore" hint={`${model.entries.length} entries.`} />
export const TemplateMembers = ({ model }: PageProps<MembersPageModel>) => <StubSurface surface="members" hint={`${model.rows.length} rows.`} />
export const TemplateMember = ({ model }: PageProps<MemberPageModel>) => <StubSurface surface="member" hint={`${model.character.name}; ${model.roleLabels.length} roles.`} />
export const TemplateWork = ({ model, workspace }: PageProps<WorkPageModel> & { workspace: WorkWorkspace }) => <StubSurface surface="work" hint={`${workspace.entries.length} entries; authorized: ${model.authorized}.`} />
export const TemplateManagementDepartments = ({ model, workspace }: PageProps<DepartmentsManagementPageModel> & { workspace: DepartmentsManagementWorkspace }) => <StubSurface surface="management.departments" hint={`${model.domainName}: ${workspace.departments.length} rows; canCreate: ${workspace.canCreate}.`} />
export const TemplateManagementFolders = ({ model, workspace }: PageProps<FolderManagementPageModel> & { workspace: FoldersManagementWorkspace }) => <StubSurface surface="management.folders" hint={`${model.domainName}: ${workspace.nodes.length} roots.`} />
export const TemplateManagementRoles = ({ model, workspace }: PageProps<RoleManagementPageModel> & { workspace: RolesManagementWorkspace }) => <StubSurface surface="management.roles" hint={`${model.domainName}: ${workspace.roles.length} roles.`} />
export const TemplateManagementDocumentTypes = ({ model, workspace }: PageProps<DocumentTypesManagementPageModel> & { workspace: DocumentTypesManagementWorkspace }) => <StubSurface surface="management.documentTypes" hint={`${model.domainName}: ${workspace.tree.length} roots.`} />
export const TemplateManagementPeople = ({ model, workspace }: PageProps<PeopleManagementPageModel> & { workspace: PeopleManagementWorkspace }) => <StubSurface surface="management.people" hint={`${model.domainName}: canSearch: ${workspace.canSearch}.`} />
export const TemplateManagementPerson = ({ model, workspace }: PageProps<PersonManagementPageModel> & { workspace: PersonManagementWorkspace }) => <StubSurface surface="management.person" hint={`${model.domainName}: ${model.character.name}; canManageMembers: ${workspace.canManageMembers}.`} />
export const TemplateManagementInvitations = ({ model, workspace }: PageProps<InvitationsManagementPageModel> & { workspace: InvitationsManagementWorkspace }) => <StubSurface surface="management.invitations" hint={`${model.domainName}: ${workspace.invitations.length} invitations.`} />