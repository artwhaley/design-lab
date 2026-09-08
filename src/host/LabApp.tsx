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
import { ActionLog, FakeBackend, type FakeBackendSnapshot } from '../workspaces'
import { getDesignDefinition, getDesignDefinitions } from '../designs/registry'
import { LabChrome } from './LabChrome'
import { SurfaceNavigator } from './SurfaceNavigator'
import { IframePreviewPane } from './IframePreviewPane'
import type { Viewport } from './PreviewPane'
import { PathSimulator, type SurfaceParams } from './PathSimulator'
import { resolveDesignRuntime } from './designRuntime'
import { ScenarioPanel } from './ScenarioPanel'
import { ActionLog as ActionLogView } from './ActionLog'
import { StudioPanel } from './StudioPanel'
import { ViewportControls } from './ViewportControls'
import { loadBank, saveBank, type SavedBank } from './configBanks'

export type LabRuntimeFlags = {
  latencyMs: number
  failNextMutation: boolean
  readError: boolean
  loadingOverride: boolean
}

const DEFAULT_FLAGS: LabRuntimeFlags = { latencyMs: 120, failNextMutation: false, readError: false, loadingOverride: false }

export function LabApp() {
  const designs = useMemo(() => getDesignDefinitions(), [])
  const [panel, setPanel] = useState<'scenario' | 'studio' | 'view' | 'log'>('scenario')
  const [designKey, setDesignKey] = useState<string>(designs[0]?.key ?? '')
  const [compareKey, setCompareKey] = useState<string | null>(null)
  const [surface, setSurface] = useState<SurfaceKey>('home')
  const [params, setParams] = useState<SurfaceParams>({})
  const [scenario, setScenario] = useState<ScenarioSpec>(() => {
    const fixtureProfile = new URLSearchParams(window.location.search).get('fixture')
    return fixtureProfile === 'obsidian-fidelity' ? { ...DEFAULT_SPEC, fixtureProfile } : DEFAULT_SPEC
  })
  const [flags, setFlags] = useState<LabRuntimeFlags>(DEFAULT_FLAGS)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [viaCompat, setViaCompat] = useState<'review' | 'subdomains' | undefined>(undefined)
  const [backendVersion, setBackendVersion] = useState(0)
  const [authoritativeHydrate, setAuthoritativeHydrate] = useState<{ snapshot: FakeBackendSnapshot; sourceInstanceId: string; token: number } | undefined>()

  const design: LabDesignDefinition | undefined = getDesignDefinition(designKey)
  const compareDesign: LabDesignDefinition | undefined = compareKey ? getDesignDefinition(compareKey) : undefined

  // --- Per-Design config drafts + saved banks (T08) -------------------------
  type ConfigDraft = { raw: unknown; savedVersion: number | null; dirty: boolean }
  const [configDrafts, setConfigDrafts] = useState<Record<string, ConfigDraft>>({})

  useEffect(() => {
    setConfigDrafts((current) => {
      if (current[designKey]) return current
      const bank = loadBank(designKey)
      const selected = getDesignDefinition(designKey)
      const fallback: ConfigDraft = { raw: selected?.config.defaults, savedVersion: null, dirty: false }
      return { ...current, [designKey]: bank ? { raw: bank.config, savedVersion: bank.version, dirty: false } : fallback }
    })
  }, [designKey])

  const fallbackDraft: ConfigDraft = { raw: design?.config.defaults, savedVersion: null, dirty: false }
  const activeDraft = configDrafts[designKey] ?? fallbackDraft

  // Backend lifecycle: one ScenarioBuilder + FakeBackend per scenario spec.
  const scenarioKey = `${scenario.persona}:${scenario.dataState}:${scenario.fixtureProfile ?? 'default'}`
  const backendRef = useRef<FakeBackend | null>(null)
  const [backend, setBackend] = useState<FakeBackend | null>(() => null)
  useEffect(() => {
    const builder = buildScenario(scenario)
    const log = new ActionLog()
    const next = new FakeBackend(builder, log, flags.latencyMs)
    backendRef.current = next
    setBackend(next)
    setBackendVersion((version) => version + 1)
    setAuthoritativeHydrate(undefined)
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
    setBackendVersion((version) => version + 1)
    setAuthoritativeHydrate(undefined)
    setFlags(DEFAULT_FLAGS)
    setScenario(DEFAULT_SPEC)
    setSurface('home')
    setParams({})
  }

  // --- Studio lifecycle -----------------------------------------------------
  const updateDraft = (next: unknown): void => {
    setConfigDrafts((current) => ({
      ...current,
      [designKey]: { ...(current[designKey] ?? fallbackDraft), raw: next, dirty: true },
    }))
  }

  const handleSave = (): void => {
    if (!design) return
    const resolved = resolveDesignRuntime(design, activeDraft.raw, activeDraft.savedVersion)
    if (!resolved.runtime) return
    if (resolved.errors.length > 0) {
      backendRef.current?.log.append('studio', 'save', 'blocked by validation errors', 'error')
      return
    }
    const bank: SavedBank = { version: design.config.version, config: resolved.runtime.config }
    saveBank(designKey, bank)
    setConfigDrafts((current) => ({ ...current, [designKey]: { ...(current[designKey] ?? fallbackDraft), raw: bank.config, savedVersion: bank.version, dirty: false } }))
    backendRef.current?.log.append('studio', 'save', `${design.key} config v${design.config.version} saved`)
  }

  const handleRevert = (): void => {
    const bank = loadBank(designKey)
    setConfigDrafts((current) => ({
      ...current,
      [designKey]: bank
        ? { raw: bank.config, savedVersion: bank.version, dirty: false }
        : { ...(current[designKey] ?? fallbackDraft), raw: design?.config.defaults, savedVersion: null, dirty: false },
    }))
    backendRef.current?.log.append('studio', 'revert', designKey)
  }

  const handleRestoreDefaults = (): void => {
    setConfigDrafts((current) => ({ ...current, [designKey]: { raw: design?.config.defaults, savedVersion: current[designKey]?.savedVersion ?? null, dirty: true } }))
    backendRef.current?.log.append('studio', 'defaults', designKey)
  }

  const uploadAsset = async (file: File, purpose: string) => {
    const url = URL.createObjectURL(file)
    backendRef.current?.log.append('studio', 'upload', `${purpose}: ${file.name} (preview-only object URL)`)
    return { url }
  }

  const handleDiagnostics = (): void => {
    const log = backendRef.current?.log
    if (!log) return
    log.append('diagnostics', 'contract', LAB_CONTRACT_VERSION)
    log.append('diagnostics', 'surfaces', `${SURFACE_CATALOG.length} catalog entries`)
    log.append('diagnostics', 'designs', `${designs.length} registered`)
    log.append('diagnostics', 'scenario', `${scenario.persona} / ${scenario.dataState}`)
  }

  const activeResolution = useMemo(() => {
    if (!design) return null
    const resolved = resolveDesignRuntime(design, activeDraft.raw, activeDraft.savedVersion)
    return resolved
  }, [design, activeDraft.raw, activeDraft.savedVersion])
  const studioValidationErrors = activeResolution?.errors ?? []

  const activeSurface = surfaceByKey(surface)
  const routeNote = viaCompat ? `/domain/aster-reach/${viaCompat}` : null
  const authoritativeSnapshot = useMemo(() => backend?.snapshot() ?? null, [backend, backendVersion])

  const handleBackendSnapshot = (snapshot: FakeBackendSnapshot, sourceInstanceId: string): void => {
    const backendNow = backendRef.current
    if (!backendNow || snapshot.revision <= backendNow.snapshot().revision) return
    backendNow.hydrate(snapshot)
    setAuthoritativeHydrate({ snapshot, sourceInstanceId, token: backendVersion + 1 })
    setBackendVersion((version) => version + 1)
  }

  const handlePreviewLog = (entry: { scope: string; action: string; detail: string; level: 'info' | 'error' }, sourceInstanceId: string): void => {
    backendRef.current?.log.append(`iframe:${sourceInstanceId}`, `${entry.scope}.${entry.action}`, entry.detail, entry.level)
  }

  const handlePreviewError = (message: string, sourceInstanceId: string): void => {
    backendRef.current?.log.append(`iframe:${sourceInstanceId}`, 'error', message, 'error')
  }

  const previewFrame = (innerDesign: LabDesignDefinition | undefined, testId: string) => {
    if (!backend) return <div className="lab-hint" style={{ padding: 24 }}>Scenario initializing…</div>
    if (!innerDesign) return <div className="lab-hint" style={{ padding: 24 }}>Select a registered Design to preview.</div>
    if (!authoritativeSnapshot) return <div className="lab-hint" style={{ padding: 24 }}>Scenario initializing…</div>
    const draft = innerDesign.key === designKey
      ? activeDraft
      : (() => {
          const bank = loadBank(innerDesign.key)
          return bank
            ? { raw: bank.config, savedVersion: bank.version }
            : { raw: innerDesign.config.defaults, savedVersion: null }
        })()
    return (
      <IframePreviewPane
        testId={testId}
        instanceId={testId}
        surface={surface}
        params={params}
        viaCompat={viaCompat}
        designKey={innerDesign.key}
        scenario={scenario}
        flags={flags}
        config={{ raw: draft.raw, savedVersion: draft.savedVersion }}
        backendSnapshot={authoritativeSnapshot}
        authoritativeHydrate={authoritativeHydrate}
        viewport={viewport}
        onNavigate={handleNavigate}
        onExternal={(href) => backend.log.append('navigation', 'external', href)}
        onBackendSnapshot={handleBackendSnapshot}
        onLog={handlePreviewLog}
        onError={(message) => handlePreviewError(message, testId)}
      />
    )
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
                    <div style={{ height: 'calc(100% - 28px)' }}>{previewFrame(design, 'lab-preview-a')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, border: '1px solid #333947', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ padding: '4px 10px', background: '#23272f', fontSize: 12, color: '#9aa3b2' }}>{compareDesign.name}</div>
                    <div style={{ height: 'calc(100% - 28px)' }}>{previewFrame(compareDesign, 'lab-preview-b')}</div>
                  </div>
                </div>
              ) : (
                previewFrame(design, 'lab-preview')
              )}
            </div>
          </div>

          <aside className="lab-right-panel" aria-label="Lab side panel">
            <div className="lab-tabs" role="tablist" aria-label="Lab workbench tabs">
              <button type="button" role="tab" aria-selected={panel === 'scenario'} className={panel === 'scenario' ? 'lab-active' : undefined} onClick={() => setPanel('scenario')}>Scenario</button>
              <button type="button" role="tab" aria-selected={panel === 'studio'} className={panel === 'studio' ? 'lab-active' : undefined} onClick={() => setPanel('studio')}>Studio</button>
              <button type="button" role="tab" aria-selected={panel === 'view'} className={panel === 'view' ? 'lab-active' : undefined} onClick={() => setPanel('view')}>View</button>
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
              {panel === 'view' ? (
                <ViewportControls viewport={viewport} onChange={setViewport} />
              ) : null}
              {panel === 'studio' && design ? (
                <StudioPanel
                  design={design}
                  draft={activeDraft.raw}
                  savedVersion={activeDraft.savedVersion}
                  dirty={activeDraft.dirty}
                  validationErrors={studioValidationErrors}
                  domain={backend ? { name: backend.builder.universe.domain.name, motto: backend.builder.universe.domain.motto, logoUrl: backend.builder.universe.domain.logoUrl } : { name: 'Aster Reach', motto: '', logoUrl: null }}
                  uploadAsset={uploadAsset}
                  onChange={updateDraft}
                  onSave={handleSave}
                  onRevert={handleRevert}
                  onRestoreDefaults={handleRestoreDefaults}
                />
              ) : panel === 'studio' ? (
                <div>
                  <h3>Studio</h3>
                  <p className="lab-hint">Select a registered Design to customize.</p>
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
