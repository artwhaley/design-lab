/**
 * Contract Probe — the Lab's executable documentation of the design contract
 * (T10). Renders every Class-A surface from the supplied Page Models and
 * workspaces, nothing more. Conformance tests drive it end to end.
 */
import type { LabDesignDefinition } from '../../contracts'
import { register } from '../registry'
import { probeConfig } from './config'
import { ProbeShell } from './ProbeShell'
import { ProbeStudioEditor } from './ProbeStudio'
import {
  ProbeAbout,
  ProbeDepartment,
  ProbeDepartments,
  ProbeHome,
  ProbeLore,
  ProbeMember,
  ProbeMembers,
} from './ProbePages'
import {
  ProbeDepartmentsManagement,
  ProbeDocumentTypesManagement,
  ProbeFoldersManagement,
  ProbeInvitationsManagement,
  ProbePeopleManagement,
  ProbePersonManagement,
  ProbeRolesManagement,
  ProbeWork,
} from './ProbeManagement'
import { ProbeDocument, ProbeRecords } from './ProbeRecords'

const contractProbe: LabDesignDefinition<import('./config').ProbeConfigV1> = {
  key: 'contract-probe',
  status: 'first-class',
  name: 'Contract Probe',
  description: 'Executable documentation of the Lab design contract: every surface, model field, and workspace operation rendered plainly.',
  preview: {
    thumbnail: '/media/lab-fixtures/aster-reach-seal.svg',
  },
  config: probeConfig,
  studio: {
    Editor: ProbeStudioEditor,
  },
  Shell: ProbeShell,
  pages: {
    home: ProbeHome,
    records: ProbeRecords,
    document: ProbeDocument,
    departments: ProbeDepartments,
    department: ProbeDepartment,
    about: ProbeAbout,
    lore: ProbeLore,
    members: ProbeMembers,
    member: ProbeMember,
    work: ProbeWork,
    management: {
      departments: ProbeDepartmentsManagement,
      folders: ProbeFoldersManagement,
      roles: ProbeRolesManagement,
      documentTypes: ProbeDocumentTypesManagement,
      people: ProbePeopleManagement,
      person: ProbePersonManagement,
      invitations: ProbeInvitationsManagement,
    },
  },
}

register(contractProbe)