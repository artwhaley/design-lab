import type { ComponentType } from 'react'

import type { DesignConfigContract, LabDesignDefinition } from '../../contracts'

const stub: ComponentType<any> = () => <div data-testid="stub-page">stub page</div>

export type StubConfig = { accent: string }

export const stubConfig: DesignConfigContract<StubConfig> = {
  version: 1,
  defaults: { accent: '#336699' },
  validate: (raw) => {
    if (raw && typeof raw === 'object' && typeof (raw as { accent?: unknown }).accent === 'string') {
      return { ok: true, value: { accent: (raw as { accent: string }).accent } }
    }
    return { ok: false, errors: ['invalid accent'] }
  },
  migrate: (_from, raw) => stubConfig.validate(raw),
  resolveTheme: (config) => ({
    base: {
      primary: '#123456', secondary: '#234567', accent: config.accent,
      pageBg: '#ffffff', surfaceBg: '#f5f5f5', surfaceBorder: '#dddddd',
      textOnPrimary: '#ffffff', headingFont: 'Georgia', bodyFont: 'Arial', mutedText: '#666666',
    },
    vars: {},
  }),
}

export function makeStubDesign(key: string, name: string): LabDesignDefinition<StubConfig> {
  return {
    key,
    status: 'first-class',
    name,
    description: 'stub design for host tests',
    preview: { thumbnail: '/media/lab-fixtures/probe.svg' },
    config: stubConfig,
    studio: { Editor: stub },
    Shell: ({ children }) => <div data-testid="stub-shell">{children}</div>,
    pages: {
      home: () => <div data-testid="stub-home">home</div>,
      records: () => <div data-testid="stub-records">records</div>,
      document: () => <div data-testid="stub-document">document</div>,
      departments: () => <div data-testid="stub-departments">departments</div>,
      department: () => <div data-testid="stub-department">department</div>,
      about: () => <div data-testid="stub-about">about</div>,
      lore: () => <div data-testid="stub-lore">lore</div>,
      members: () => <div data-testid="stub-members">members</div>,
      member: () => <div data-testid="stub-member">member</div>,
      work: () => <div data-testid="stub-work">work</div>,
      management: {
        departments: () => <div data-testid="stub-m-departments">m-departments</div>,
        folders: () => <div data-testid="stub-m-folders">m-folders</div>,
        roles: () => <div data-testid="stub-m-roles">m-roles</div>,
        documentTypes: () => <div data-testid="stub-m-documentTypes">m-documentTypes</div>,
        people: () => <div data-testid="stub-m-people">m-people</div>,
        person: () => <div data-testid="stub-m-person">m-person</div>,
        invitations: () => <div data-testid="stub-m-invitations">m-invitations</div>,
      },
    },
  }
}