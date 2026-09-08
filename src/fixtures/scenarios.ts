/**
 * Scenario vocabulary (04_FIXTURE_AND_SCENARIO_SPEC.md). Personas select
 * precomputed safe projections/capabilities — the Lab never evaluates real
 * authorization (A07).
 */
export type PersonaKey = 'visitor' | 'member' | 'departmentManager' | 'admin'
export type DataStateKey = 'populated' | 'empty' | 'stress'
export type FixtureProfileKey = 'default' | 'obsidian-fidelity'

export type ScenarioSpec = {
  persona: PersonaKey
  dataState: DataStateKey
  /** Optional deterministic content profile; authorization remains persona/data-state based. */
  fixtureProfile?: FixtureProfileKey
}

export const PERSONA_LABELS: Record<PersonaKey, string> = {
  visitor: 'Visitor',
  member: 'Ordinary Member',
  departmentManager: 'Department Manager',
  admin: 'Domain Admin',
}

export const DATA_STATE_LABELS: Record<DataStateKey, string> = {
  populated: 'Populated',
  empty: 'Empty',
  stress: 'Stress',
}

export const DEFAULT_SPEC: ScenarioSpec = { persona: 'admin', dataState: 'populated' }

export const OBSIDIAN_FIDELITY_SPEC: ScenarioSpec = {
  persona: 'admin',
  dataState: 'populated',
  fixtureProfile: 'obsidian-fidelity',
}

export const PERSONAS: readonly PersonaKey[] = ['visitor', 'member', 'departmentManager', 'admin']
export const DATA_STATES: readonly DataStateKey[] = ['populated', 'empty', 'stress']
