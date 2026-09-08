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
import { ObsidianRecords } from './ObsidianRecords'
import { ObsidianDocument } from './ObsidianDocument'
import { AboutAdapter } from './adapters/AboutAdapter'
import { LoreAdapter } from './adapters/LoreAdapter'
import { DepartmentsAdapter } from './adapters/DepartmentsAdapter'
import { ObsidianDepartmentDetail } from './ObsidianDepartmentDetail'
import { MemberAdapter } from './adapters/MemberAdapter'
import { MembersAdapter } from './adapters/MembersAdapter'
import { ObsidianFolderManager } from './ObsidianFolderManager'
import { ObsidianDocumentTypes } from './ObsidianDocumentTypes'
import {
  ObsidianDepartmentsManagement,
  ObsidianInvitationsManagement,
  ObsidianPeopleManagement,
  ObsidianPersonManagement,
  ObsidianRolesManagement,
  ObsidianWork,
} from './ObsidianManagement'
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
    records: ObsidianRecords,
    document: ObsidianDocument,
    departments: DepartmentsAdapter,
    department: ObsidianDepartmentDetail,
    about: AboutAdapter,
    lore: LoreAdapter,
    members: MembersAdapter,
    member: MemberAdapter,
    work: ObsidianWork,
    management: {
      departments: ObsidianDepartmentsManagement,
      folders: ObsidianFolderManager,
      roles: ObsidianRolesManagement,
      documentTypes: ObsidianDocumentTypes,
      people: ObsidianPeopleManagement,
      person: ObsidianPersonManagement,
      invitations: ObsidianInvitationsManagement,
    },
  },
}

register(obsidianLab)
