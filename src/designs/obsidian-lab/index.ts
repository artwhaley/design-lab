/**
 * Obsidian Lab — the Lab's second first-class Design: the Obsidian
 * presentation ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 and adapted to the Lab
 * contract (models, runtime config, workspaces, action bridges).
 */
import type { LabDesignDefinition } from '../../contracts'
import { register } from '../registry'
import { obsidianConfig, type ObsidianConfig } from './config'
import { ObsidianShellAdapter } from './adapters/ShellAdapter'
import { HomeAdapter } from './adapters/HomeAdapter'
import { RecordsAdapter } from './adapters/RecordsAdapter'
import { DocumentAdapter } from './adapters/DocumentAdapter'
import { AboutAdapter } from './adapters/AboutAdapter'
import { LoreAdapter } from './adapters/LoreAdapter'
import { DepartmentsAdapter } from './adapters/DepartmentsAdapter'
import { DepartmentAdapter } from './adapters/DepartmentAdapter'
import { MemberAdapter } from './adapters/MemberAdapter'
import { MembersAdapter } from './adapters/MembersAdapter'
import { FoldersAdapter } from './adapters/management/FoldersAdapter'
import { DocumentTypesAdapter } from './adapters/management/DocumentTypesAdapter'
import { WorkAdapter } from './adapters/WorkAdapter'
import { DepartmentsAdapter as ManagementDepartmentsAdapter } from './adapters/management/DepartmentsAdapter'
import { RolesAdapter } from './adapters/management/RolesAdapter'
import { PeopleAdapter } from './adapters/management/PeopleAdapter'
import { PersonAdapter } from './adapters/management/PersonAdapter'
import { InvitationsAdapter } from './adapters/management/InvitationsAdapter'
import { ObsidianStudioEditor } from './Studio'

const obsidianLab: LabDesignDefinition<ObsidianConfig> = {
  key: 'obsidian-lab',
  status: 'first-class',
  name: 'Obsidian Lab',
  description: 'The Obsidian presentation (dark, editorial, Radix/Lucide) adapted as a first-class Lab Design for consumer validation of the contract.',
  preview: {
    thumbnail: '/media/lab-fixtures/aster-reach-seal.svg',
  },
  config: obsidianConfig,
  studio: {
    Editor: ObsidianStudioEditor,
  },
  Shell: ObsidianShellAdapter,
  pages: {
    home: HomeAdapter,
    records: RecordsAdapter,
    document: DocumentAdapter,
    departments: DepartmentsAdapter,
    department: DepartmentAdapter,
    about: AboutAdapter,
    lore: LoreAdapter,
    members: MembersAdapter,
    member: MemberAdapter,
    work: WorkAdapter,
    management: {
      departments: ManagementDepartmentsAdapter,
      folders: FoldersAdapter,
      roles: RolesAdapter,
      documentTypes: DocumentTypesAdapter,
      people: PeopleAdapter,
      person: PersonAdapter,
      invitations: InvitationsAdapter,
    },
  },
}

register(obsidianLab)
