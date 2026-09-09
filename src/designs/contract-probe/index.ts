/**
 * Contract Probe — the Lab's executable documentation of the portable Design
 * contract (T10). Renders every Class-A surface from the supplied Page Models
 * and workspaces, nothing more. Conformance tests drive it end to end.
 *
 * This fixture implements the same production `DesignDefinition` contract as
 * a real first-class Design (16 Class A slots, no `member`). It is discovered
 * from its manifest like any other Design; it is a Lab conformance fixture and
 * is not intended to be installed into production.
 */
import type { DesignDefinition } from '@/lib/design/types'
import { probeConfig } from './config'
import { ProbeShell } from './ProbeShell'
import { ProbeStudioEditor } from './ProbeStudio'
import {
  ProbeAbout,
  ProbeDepartment,
  ProbeDepartments,
  ProbeHome,
  ProbeLore,
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

export const contractProbe: DesignDefinition<import('./config').ProbeConfigV1> = {
  key: 'contract-probe',
  status: 'first-class',
  name: 'Contract Probe',
  description: 'Lab conformance fixture — renders every required surface plainly from its Page Models. Not intended for production installation.',
  preview: {
    thumbnail: '/design-assets/contract-probe/thumbnail.svg',
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

export default contractProbe