/**
 * The complete first-class Design definition contract (Bible §7) plus the
 * runtime/config/theme/Studio machinery the Lab emulates. Pure types — no
 * Payload, no Next, no Node imports (A03).
 *
 * All required slots are REQUIRED here from day one (A05): the Lab has no
 * compatibility-design concept in the authoring path.
 */
import type { ComponentType, ReactNode } from 'react'

import type {
  AboutPageModel,
  DepartmentPageModel,
  DepartmentsManagementPageModel,
  DepartmentsPageModel,
  DocumentPageModel,
  DocumentTypesManagementPageModel,
  DomainShellModel,
  FolderManagementPageModel,
  HomePageModel,
  InvitationsManagementPageModel,
  LorePageModel,
  MemberPageModel,
  MembersPageModel,
  PeopleManagementPageModel,
  PersonManagementPageModel,
  RecordsPageModel,
  RoleManagementPageModel,
  WorkPageModel,
} from './pageModels'
import type {
  DepartmentsManagementWorkspace,
  DocumentTypesManagementWorkspace,
  FoldersManagementWorkspace,
  InvitationsManagementWorkspace,
  PeopleManagementWorkspace,
  PersonManagementWorkspace,
  RecordsWorkspace,
  RolesManagementWorkspace,
  WorkWorkspace,
} from './workspaces'
import type { DocumentActionBridge } from './actions'

// ---------------------------------------------------------------------------
// Validation, assets, theme
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

/** A local authorized media reference only: /media/... URLs. */
export type DesignAssetRef = {
  url: string
}

export const MEDIA_REF_RE = /^\/media\//

export type BaseDesignTheme = {
  primary: string
  secondary: string
  accent: string
  pageBg: string
  surfaceBg: string
  surfaceBorder: string
  textOnPrimary: string
  headingFont: string
  bodyFont: string
  mutedText: string
}

/** Universal base token -> CSS variable mapping (Bible §12). */
export const BASE_THEME_VARS: Record<keyof BaseDesignTheme, string> = {
  primary: '--tenant-primary',
  secondary: '--tenant-secondary',
  accent: '--tenant-accent',
  pageBg: '--tenant-page-bg',
  surfaceBg: '--tenant-surface-bg',
  surfaceBorder: '--tenant-surface-border',
  textOnPrimary: '--tenant-text-on-primary',
  headingFont: '--tenant-heading-font',
  bodyFont: '--tenant-body-font',
  mutedText: '--tenant-muted-text',
}

/**
 * A Design resolves its validated config into the universal base tokens plus
 * unlimited Design-owned vars (`--my-design-*`). Design-owned vars are used
 * verbatim as CSS custom-property names.
 */
export type ResolvedDesignTheme = {
  base: BaseDesignTheme
  vars: Record<string, string>
}

/** Assemble the full CSS custom-property map applied at the preview root. */
export function resolveCssVars(theme: ResolvedDesignTheme): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(BASE_THEME_VARS) as Array<keyof BaseDesignTheme>) {
    out[BASE_THEME_VARS[key]] = theme.base[key]
  }
  return { ...out, ...theme.vars }
}

// ---------------------------------------------------------------------------
// Config contract
// ---------------------------------------------------------------------------

export type DesignConfigContract<TConfig extends object> = {
  version: number
  defaults: TConfig
  validate(raw: unknown): ValidationResult<TConfig>
  migrate(fromVersion: number, raw: unknown): ValidationResult<TConfig>
  resolveTheme(config: TConfig): ResolvedDesignTheme
}

// ---------------------------------------------------------------------------
// Runtime delivered to every surface
// ---------------------------------------------------------------------------

export type DesignRuntime<TConfig extends object> = {
  /** Validated config — never raw persisted input (Bible §8). */
  config: TConfig
  theme: ResolvedDesignTheme
  cssVars: Record<string, string>
}

// ---------------------------------------------------------------------------
// Shell + page props
// ---------------------------------------------------------------------------

export type LabShellProps<TConfig extends object> = {
  model: DomainShellModel
  runtime: DesignRuntime<TConfig>
  children: ReactNode
}

export type LabPageProps<TModel, TConfig extends object> = {
  model: TModel
  runtime: DesignRuntime<TConfig>
}

// Interactive surfaces add their workspace/action bridge as an explicit prop.
export type RecordsPageProps<TConfig extends object> = LabPageProps<RecordsPageModel, TConfig> & { workspace: RecordsWorkspace }
export type DocumentPageProps<TConfig extends object> = LabPageProps<DocumentPageModel, TConfig> & { actions: DocumentActionBridge }
export type WorkPageProps<TConfig extends object> = LabPageProps<WorkPageModel, TConfig> & { workspace: WorkWorkspace }
export type DepartmentsManagementPageProps<TConfig extends object> = LabPageProps<DepartmentsManagementPageModel, TConfig> & { workspace: DepartmentsManagementWorkspace }
export type FoldersManagementPageProps<TConfig extends object> = LabPageProps<FolderManagementPageModel, TConfig> & { workspace: FoldersManagementWorkspace }
export type RolesManagementPageProps<TConfig extends object> = LabPageProps<RoleManagementPageModel, TConfig> & { workspace: RolesManagementWorkspace }
export type DocumentTypesManagementPageProps<TConfig extends object> = LabPageProps<DocumentTypesManagementPageModel, TConfig> & { workspace: DocumentTypesManagementWorkspace }
export type PeopleManagementPageProps<TConfig extends object> = LabPageProps<PeopleManagementPageModel, TConfig> & { workspace: PeopleManagementWorkspace }
export type PersonManagementPageProps<TConfig extends object> = LabPageProps<PersonManagementPageModel, TConfig> & { workspace: PersonManagementWorkspace }
export type InvitationsManagementPageProps<TConfig extends object> = LabPageProps<InvitationsManagementPageModel, TConfig> & { workspace: InvitationsManagementWorkspace }

// ---------------------------------------------------------------------------
// Studio editor
// ---------------------------------------------------------------------------

export type LabStudioEditorProps<TConfig extends object> = {
  value: TConfig
  onChange(next: TConfig): void
  domain: {
    name: string
    motto: string
    logoUrl: string | null
  }
  uploadAsset(file: File, purpose: string): Promise<DesignAssetRef>
}

// ---------------------------------------------------------------------------
// Design definition
// ---------------------------------------------------------------------------

export type LabDesignPages<TConfig extends object> = {
  home: ComponentType<LabPageProps<HomePageModel, TConfig>>
  records: ComponentType<RecordsPageProps<TConfig>>
  document: ComponentType<DocumentPageProps<TConfig>>
  departments: ComponentType<LabPageProps<DepartmentsPageModel, TConfig>>
  department: ComponentType<LabPageProps<DepartmentPageModel, TConfig>>
  about: ComponentType<LabPageProps<AboutPageModel, TConfig>>
  lore: ComponentType<LabPageProps<LorePageModel, TConfig>>
  members: ComponentType<LabPageProps<MembersPageModel, TConfig>>
  member: ComponentType<LabPageProps<MemberPageModel, TConfig>>
  work: ComponentType<WorkPageProps<TConfig>>
  management: {
    departments: ComponentType<DepartmentsManagementPageProps<TConfig>>
    folders: ComponentType<FoldersManagementPageProps<TConfig>>
    roles: ComponentType<RolesManagementPageProps<TConfig>>
    documentTypes: ComponentType<DocumentTypesManagementPageProps<TConfig>>
    people: ComponentType<PeopleManagementPageProps<TConfig>>
    person: ComponentType<PersonManagementPageProps<TConfig>>
    invitations: ComponentType<InvitationsManagementPageProps<TConfig>>
  }
}

export type LabDesignDefinition<TConfig extends object = object> = {
  key: string
  status: 'first-class'
  name: string
  description: string

  preview: {
    thumbnail: string
  }

  config: DesignConfigContract<TConfig>

  studio: {
    Editor: ComponentType<LabStudioEditorProps<TConfig>>
  }

  Shell: ComponentType<LabShellProps<TConfig>>

  pages: LabDesignPages<TConfig>
}