import { describe, expect, it } from 'vitest'

import {
  OBSIDIAN_ABOUT_BODY_HTML,
  OBSIDIAN_DOCUMENT_BODY_HTML,
  OBSIDIAN_FIDELITY_SPEC,
  OBSIDIAN_HOME_WELCOME_HTML,
  buildScenario,
} from '../fixtures'

describe('Obsidian fidelity fixture profile', () => {
  it('uses source-equivalent values through existing generic semantic fields', () => {
    const scenario = buildScenario(OBSIDIAN_FIDELITY_SPEC)

    expect(scenario.spec.fixtureProfile).toBe('obsidian-fidelity')
    expect(scenario.shellModel().domain.motto).toBe('What we remember, we become.')
    expect(scenario.shellModel().primaryNavigation.map((item) => item.label)).toEqual([
      'Home', 'About', 'Lore', 'Departments', 'Records',
    ])
    expect(scenario.shellModel().managementNavigation.map((item) => item.label)).toEqual([
      'People', 'Members', 'Roles', 'Folders', 'Departments', 'Document Types', 'Invitations', 'Customize',
    ])
    expect(scenario.homeModel().welcome.html).toBe(OBSIDIAN_HOME_WELCOME_HTML)
    expect(scenario.aboutModel().bodyHtml).toBe(OBSIDIAN_ABOUT_BODY_HTML)

    const records = scenario.recordsModel()
    expect(records.totalReadableRecordCount).toBe(72)
    expect(records.records.slice(0, 6).map((record) => record.title)).toEqual([
      'The Northwatch Accord',
      'A survey of the outer islands',
      'Minutes of the autumn assembly',
      'On the keeping of names',
      'The return of the Wayfarer',
      'Stewardship of the eastern passage',
    ])
    expect(records.documentTypes.map((type) => type.name)).toEqual([
      'Accord', 'Field report', 'Council minutes', 'Charter',
    ])
    expect(records.folders.map((folder) => [folder.name, folder.readableRecordCount])).toEqual([
      ['Foundations', 18], ['The council', 24], ['Expeditions', 12], ['People & places', 18],
    ])

    const document = scenario.documentModel(1)
    expect(document.bodyHtml).toBe(OBSIDIAN_DOCUMENT_BODY_HTML)
    expect(document.meta).toEqual([
      { label: 'Document type', value: 'Accord' },
      { label: 'Collection', value: 'Foundations' },
      { label: 'Filed', value: 'September 7, 2026' },
      { label: 'Prepared by', value: 'Elara Voss' },
    ])
    expect(scenario.departmentsModel().departments.map((department) => department.name)).toEqual([
      'Northwatch Council', 'Harbor office', 'Survey corps',
    ])
    expect(scenario.departmentsModel().departments.map((department) => department.memberCount)).toEqual([7, 3, 5])
    expect(scenario.loreModel().entries.map((entry) => entry.title)).toEqual([
      'The Reach at a glance', 'Northwatch', 'The outer islands', 'The autumn assembly', 'Stewards and keepers', 'Trade and passage',
    ])
  })

  it('does not add organization-chart relationships to the generic fixture', () => {
    const scenario = buildScenario(OBSIDIAN_FIDELITY_SPEC)
    expect(scenario.departmentModel('northwatch-council').members.map((member) => member.name)).toEqual([
      'Elara Voss', 'Mira Sol', 'Orren Pike', 'Lyra Fen', 'Kest Marrow',
    ])
    expect(scenario.departmentModel('northwatch-council').members.every((member) => !('parentId' in member))).toBe(true)
  })
})
