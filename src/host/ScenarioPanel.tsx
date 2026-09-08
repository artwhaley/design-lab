/**
 * ScenarioPanel — lets a design author switch personas, data states, and
 * runtime failure states from Lab chrome alone (T07). Persona switches rebuild
 * a safe scenario projection; failure injection happens in the fake
 * backend/workspace, never in Design code.
 */
import { DATA_STATE_LABELS, DATA_STATES, PERSONA_LABELS, PERSONAS, type ScenarioSpec } from '../fixtures'
import type { LabRuntimeFlags } from './LabApp'

type Props = {
  scenario: ScenarioSpec
  flags: LabRuntimeFlags
  onScenarioChange(next: ScenarioSpec): void
  onFlagsChange(next: LabRuntimeFlags): void
  onReset(): void
}

export function ScenarioPanel({ scenario, flags, onScenarioChange, onFlagsChange, onReset }: Props) {
  const setPersona = (persona: ScenarioSpec['persona']) => onScenarioChange({ ...scenario, persona })
  const setDataState = (dataState: ScenarioSpec['dataState']) => onScenarioChange({ ...scenario, dataState })

  return (
    <div>
      <h3>Scenario</h3>

      <label htmlFor="lab-persona">Persona</label>
      <select id="lab-persona" value={scenario.persona} onChange={(e) => setPersona(e.target.value as ScenarioSpec['persona'])}>
        {PERSONAS.map((persona) => (
          <option key={persona} value={persona}>{PERSONA_LABELS[persona]}</option>
        ))}
      </select>
      <p className="lab-hint">Persona selects a precomputed authorization-safe projection. No policy is evaluated.</p>

      <label htmlFor="lab-data-state">Data state</label>
      <select id="lab-data-state" value={scenario.dataState} onChange={(e) => setDataState(e.target.value as ScenarioSpec['dataState'])}>
        {DATA_STATES.map((state) => (
          <option key={state} value={state}>{DATA_STATE_LABELS[state]}</option>
        ))}
      </select>

      <h3 style={{ marginTop: 16 }}>Runtime simulation</h3>

      <label htmlFor="lab-latency">Fake latency</label>
      <select
        id="lab-latency"
        value={flags.latencyMs}
        onChange={(e) => onFlagsChange({ ...flags, latencyMs: Number(e.target.value) })}
      >
        <option value={0}>0 ms (instant)</option>
        <option value={120}>120 ms (default)</option>
        <option value={400}>400 ms (slow)</option>
      </select>

      <div className="lab-row" style={{ marginTop: 8 }}>
        <input
          id="lab-loading"
          type="checkbox"
          checked={flags.loadingOverride}
          onChange={(e) => onFlagsChange({ ...flags, loadingOverride: e.target.checked })}
        />
        <label htmlFor="lab-loading">Current workspace loading</label>
      </div>

      <div className="lab-row">
        <input
          id="lab-read-error"
          type="checkbox"
          checked={flags.readError}
          onChange={(e) => onFlagsChange({ ...flags, readError: e.target.checked })}
        />
        <label htmlFor="lab-read-error">Current surface read error</label>
      </div>

      <div className="lab-row">
        <input
          id="lab-fail-next"
          type="checkbox"
          checked={flags.failNextMutation}
          onChange={(e) => onFlagsChange({ ...flags, failNextMutation: e.target.checked })}
        />
        <label htmlFor="lab-fail-next">Next mutation fails (consumed once)</label>
      </div>

      <div className="lab-actions">
        <button type="button" className="lab-button lab-primary" onClick={onReset}>Reset scenario</button>
      </div>
    </div>
  )
}