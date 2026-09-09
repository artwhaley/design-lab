/**
 * Scenario vocabulary (04_FIXTURE_AND_SCENARIO_SPEC.md). Personas select
 * precomputed safe projections/capabilities — the Lab never evaluates real
 * authorization (A07).
 */
export type PersonaKey = 'visitor' | 'member' | 'departmentManager' | 'admin'
export type DataStateKey = 'populated' | 'empty' | 'stress'
export type FixtureProfileKey = 'default' | 'obsidian-fidelity' | 'production-preview'

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

/**
 * The Lab opens on the production fixture oracle so a dropped-in Design is
 * immediately comparable with the production parity surface. Authors can
 * still opt into the richer Lab-only fixture profiles through the URL.
 */
export const DEFAULT_SPEC: ScenarioSpec = { persona: 'admin', dataState: 'populated', fixtureProfile: 'production-preview' }

export const OBSIDIAN_FIDELITY_SPEC: ScenarioSpec = {
  persona: 'admin',
  dataState: 'populated',
  fixtureProfile: 'obsidian-fidelity',
}

/** Uses the exact deterministic models exported by production's fixture oracle. */
export const PRODUCTION_PREVIEW_SPEC: ScenarioSpec = {
  persona: 'admin',
  dataState: 'populated',
  fixtureProfile: 'production-preview',
}

export const PERSONAS: readonly PersonaKey[] = ['visitor', 'member', 'departmentManager', 'admin']
export const DATA_STATES: readonly DataStateKey[] = ['populated', 'empty', 'stress']
