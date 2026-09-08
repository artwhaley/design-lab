/**
 * LabApp — the Lab host (T06 base; T07–T09 extend the side panel and chrome).
 * Owns: active Design(s), surface + params, scenario, fake backend lifecycle,
 * runtime flags, viewport, compare mode, and the path simulator wiring.
 * No host code branches on Design key (Guardrail 3).
 */
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  LAB_CONTRACT_VERSION,
  SURFACE_CATALOG,
  surfaceByKey,
  type LabDesignDefinition,
  type SurfaceDescriptor,
  type SurfaceKey,
} from '../contracts'
import { buildScenario, DEFAULT_SPEC, type ScenarioSpec } from '../fixtures'
import { ActionLog, FakeBackend } from '../workspaces'
import { getDesignDefinition, getDesignDefinitions } from '../designs/registry'
import { LabChrome, VIEWPORT_PRESETS, type ViewportPreset } from './LabChrome'
import { SurfaceNavigator } from './SurfaceNavigator'
import { PreviewPane, type Viewport } from './PreviewPane'
import { PathSimulator, type SurfaceParams } from './PathSimulator'
import { resolveDesignRuntime } from './designRuntime'
import { ScenarioPanel } from './ScenarioPanel'
import { ActionLog as ActionLogView } from './ActionLog'

export type LabRuntimeFlags = {
  latencyMs: number
  failNextMutation: boolean
  readError: boolean
  loadingOverride: boolean
}

const DEFAULT_FLAGS: LabRuntimeFlags = { latencyMs: 120, failNextMutation: false, readError: false, loadingOverride: false }

export function LabApp() {
  const designs = useMemo(() => getDesignDefinitions(), [])
  const [panel, setPanel] = useState<'scenario' | 'studio' | 'log'>('scenario')
  const [designKey, setDesignKey] = useState<string>(designs[0]?.key ?? '')
  const [compareKey, setCompareKey] = useState<string | null>(null)
  const [surface, setSurface] = useState<SurfaceKey>('home')
  const [params, setParams] = useState<SurfaceParams>({})
  const [scenario, setScenario] = useState<ScenarioSpec>(DEFAULT_SPEC)
  const [flags, setFlags] = useState<LabRuntimeFlags>(DEFAULT_FLAGS)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [viaCompat, setViaCompat] = useState<'review' | 'subdomains' | undefined>(undefined)

  const design: LabDesignDefinition | undefined = getDesignDefinition(designKey)
  const compareDesign: LabDesignDefinition | undefined = compareKey ? getDesignDefinition(compareKey) : undefined

  // Backend lifecycle: one ScenarioBuilder + FakeBackend per scenario spec.
  const scenarioKey = `${scenario.persona}:${scenario.dataState}`
  const backendRef = useRef<FakeBackend | null>(null)
  const [backend, setBackend] = useState<FakeBackend | null>(() => null)
  useEffect(() => {
    const builder = buildScenario(scenario)
    const log = new ActionLog()
    const next = new FakeBackend(builder, log, flags.latencyMs)
    backendRef.current = next
    setBackend(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioKey])
  useEffect(() => {
    if (backendRef.current) {
      backendRef.current.latencyMs = flags.latencyMs
      backendRef.current.failNextMutation = flags.failNextMutation
      backendRef.current.readError = flags.readError
      backendRef.current.loadingOverride = flags.loadingOverride
    }
  }, [flags])

  const simulator = useMemo(() => new PathSimulator('/domain/aster-reach'), [])

  const handleNavigate = (href: string): void => {
    const backendNow = backendRef.current
    const target = simulator.simulate(href)
    if (target.kind === 'external') {
      backendNow?.log.append('navigation', 'external', href)
      return
    }
    setViaCompat(target.viaCompat)
    setSurface(target.surface)
    setParams(target.params)
    backendNow?.log.append('navigation', 'surface', `${target.surface}${target.viaCompat ? ` (via /${target.viaCompat})` : ''}`)
  }

  const handleSurfaceSelect = (descriptor: SurfaceDescriptor): void => {
    setViaCompat(undefined)
    setSurface(descriptor.key)
    setParams({})
    backendRef.current?.log.append('navigation', 'surface', descriptor.key)
  }

  const handleReset = (): void => {
    backendRef.current?.reset()
    setFlags(DEFAULT_FLAGS)
    setScenario(DEFAULT_SPEC)
    setSurface('home')
    setParams({})
  }

  const handleDiagnostics = (): void => {
    const log = backendRef.current?.log
    if (!log) return
    log.append('diagnostics', 'contract', LAB_CONTRACT_VERSION)
    log.append('diagnostics', 'surfaces', `${SURFACE_CATALOG.length} catalog entries`)
    log.append('diagnostics', 'designs', `${designs.length} registered`)
    log.append('diagnostics', 'scenario', `${scenario.persona} / ${scenario.dataState}`)
  }

  const designRuntime = useMemo(() => {
    if (!design) return null
    const resolved = resolveDesignRuntime(design, design.config.defaults, null)
    return resolved.runtime
  }, [design])

  const compareRuntime = useMemo(() => {
    if (!compareDesign) return null
    const resolved = resolveDesignRuntime(compareDesign, compareDesign.config.defaults, null)
    return resolved.runtime
  }, [compareDesign])

  const activeSurface = surfaceByKey(surface)
  const routeNote = viaCompat ? `/domain/aster-reach/${viaCompat}` : null

  const previewFrame = (innerDesign: LabDesignDefinition | undefined, innerRuntime: ReturnType<typeof resolveDesignRuntime>['runtime'] | null, testId: string) => {
    if (!backend) return <div className="lab-hint" style={{ padding: 24 }}>Scenario initializing…</div>
    if (!innerDesign || !innerRuntime) return <div className="lab-hint" style={{ padding: 24 }}>Select a registered Design to preview.</div>
    return (
      <PreviewPane
        testId={testId}
        design={innerDesign}
        builder={backend.builder}
        backend={backend}
        surface={surface}
        params={params}
        viaCompat={viaCompat}
        runtime={innerRuntime}
        viewport={viewport}
        onNavigate={handleNavigate}
      />
    )
  }

  const viewportPresets: readonly ViewportPreset[] = VIEWPORT_PRESETS
  const applyViewport = (index: number): void => {
    setViewport(index >= 0 ? { width: viewportPresets[index].width, height: viewportPresets[index].height, label: viewportPresets[index].label } : null)
  }

  return (
    <div className="lab-chrome">
      <LabChrome
        designs={designs}
        designKey={designKey}
        compareKey={compareKey}
        onDesignChange={setDesignKey}
        onCompareChange={setCompareKey}
        surface={activeSurface}
        viewportLabel={viewport?.label ?? 'Fluid'}
        onViewportChange={applyViewport}
        compareEnabled={designs.length > 1}
        onToggleCompare={() => setCompareKey(compareKey ? null : (designs.find((d) => d.key !== designKey)?.key ?? null))}
        onReset={handleReset}
        onRunDiagnostics={handleDiagnostics}
        routeNote={routeNote}
      />

      <div className="lab-body">
        <SurfaceNavigator active={surface} onSelect={handleSurfaceSelect} />

        <div className="lab-main">
          <div className="lab-preview-column">
            <div className="lab-preview-frame">
              {compareKey && compareDesign ? (
                <div data-testid="lab-compare" style={{ display: 'flex', gap: 16, minHeight: '100%' }}>
                  <div style={{ flex: 1, minWidth: 0, border: '1px solid #333947', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '4px 10px', background: '#23272f', fontSize: 12, color: '#9aa3b2' }}>{design?.name ?? designKey}</div>
                    <div style={{ height: 'calc(100% - 28px)' }}>{previewFrame(design, designRuntime, 'lab-preview-a')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, border: '1px solid #333947', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '4px 10px', background: '#23272f', fontSize: 12, color: '#9aa3b2' }}>{compareDesign.name}</div>
                    <div style={{ height: 'calc(100% - 28px)' }}>{previewFrame(compareDesign, compareRuntime, 'lab-preview-b')}</div>
                  </div>
                </div>
              ) : (
                previewFrame(design, designRuntime, 'lab-preview')
              )}
            </div>
          </div>

          <aside className="lab-right-panel" aria-label="Lab side panel">
            <div className="lab-tabs" role="tablist" aria-label="Lab workbench tabs">
              <button type="button" role="tab" aria-selected={panel === 'scenario'} className={panel === 'scenario' ? 'lab-active' : undefined} onClick={() => setPanel('scenario')}>Scenario</button>
              <button type="button" role="tab" aria-selected={panel === 'studio'} className={panel === 'studio' ? 'lab-active' : undefined} onClick={() => setPanel('studio')}>Studio</button>
              <button type="button" role="tab" aria-selected={panel === 'log'} className={panel === 'log' ? 'lab-active' : undefined} onClick={() => setPanel('log')}>Log</button>
            </div>
            <div className="lab-panel-body" role="tabpanel">
              {panel === 'scenario' ? (
                <ScenarioPanel
                  scenario={scenario}
                  flags={flags}
                  onScenarioChange={setScenario}
                  onFlagsChange={setFlags}
                  onReset={handleReset}
                />
              ) : null}
              {panel === 'studio' ? (
                <div>
                  <h3>Studio</h3>
                  <p className="lab-hint">Per-Design config banks and the Design-owned Studio editor arrive in T08.</p>
                </div>
              ) : null}
              {panel === 'log' && backend ? (
                <ActionLogView log={backend.log} />
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}