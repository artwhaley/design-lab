/**
 * <Name> Design — template skeleton.
 *
 * This folder is the copy source for new Designs (npm run new-design). It is
 * deliberately NOT registered: the registry comment forbids the _template
 * from appearing as a Design. After copying, register the new Design by
 * adding one import to src/designs/index.ts (see docs/ADDING_A_DESIGN.md).
 */
import type { LabDesignDefinition } from '../../contracts'
import { templateConfig, type TemplateConfigV1 } from './config'
import { TemplateShell } from './TemplateShell'
import { TemplateStudioEditor } from './TemplateStudio'
import {
  TemplateAbout,
  TemplateDepartment,
  TemplateDepartments,
  TemplateDocument,
  TemplateHome,
  TemplateLore,
  TemplateManagementDepartments,
  TemplateManagementDocumentTypes,
  TemplateManagementFolders,
  TemplateManagementInvitations,
  TemplateManagementPeople,
  TemplateManagementPerson,
  TemplateManagementRoles,
  TemplateMember,
  TemplateMembers,
  TemplateRecords,
  TemplateWork,
} from './TemplatePages'

export const templateDesign: LabDesignDefinition<TemplateConfigV1> = {
  key: 'template',
  status: 'first-class',
  name: '<Name>',
  description: 'Template skeleton — replace every stub before commissioning.',
  preview: {
    thumbnail: '/media/lab-fixtures/aster-reach-seal.svg',
  },
  config: templateConfig,
  studio: {
    Editor: TemplateStudioEditor,
  },
  Shell: TemplateShell,
  pages: {
    home: TemplateHome,
    records: TemplateRecords,
    document: TemplateDocument,
    departments: TemplateDepartments,
    department: TemplateDepartment,
    about: TemplateAbout,
    lore: TemplateLore,
    members: TemplateMembers,
    member: TemplateMember,
    work: TemplateWork,
    management: {
      departments: TemplateManagementDepartments,
      folders: TemplateManagementFolders,
      roles: TemplateManagementRoles,
      documentTypes: TemplateManagementDocumentTypes,
      people: TemplateManagementPeople,
      person: TemplateManagementPerson,
      invitations: TemplateManagementInvitations,
    },
  },
}