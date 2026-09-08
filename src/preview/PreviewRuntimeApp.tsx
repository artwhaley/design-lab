import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'

import { buildScenario } from '../fixtures'
import type { LabDesignDefinition } from '../contracts'
import { getDesignDefinition } from '../designs/registry'
import { ActionLog, FakeBackend, type FakeBackendSnapshot } from '../workspaces'
import { resolveDesignRuntime } from '../host/designRuntime'
import { PreviewRenderer } from './PreviewRenderer'
import {
  PREVIEW_PROTOCOL_VERSION,
  isHostToPreviewMessage,
  postPreviewMessage,
  type PreviewState,
} from './protocol'

type Props = { instanceId?: string }

function getInstanceId(explicit?: string): string {
  if (explicit) return explicit
  const fromQuery = new URLSearchParams(window.location.search).get('instanceId')
  if (fromQuery) return fromQuery
  return `preview-${Math.random().toString(36).slice(2)}`
}

type RuntimeBundle = {
  design: LabDesignDefinition
  builder: ReturnType<typeof buildScenario>
  backend: FakeBackend
  runtime: ReturnType<typeof resolveDesignRuntime>['runtime']
}

class PreviewErrorBoundary extends Component<{ children: ReactNode; onError(error: Error): void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error }
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError(error)
  }

  render() {
    if (this.state.error) {
      return <div data-testid="preview-error" className="preview-error"><strong>Design preview failed</strong><span>{this.state.error.message}</span></div>
    }
    return this.props.children
  }
}

export function PreviewRuntimeApp({ instanceId: explicitInstanceId }: Props) {
  const instanceId = useMemo(() => getInstanceId(explicitInstanceId), [explicitInstanceId])
  const [state, setState] = useState<PreviewState | null>(null)
  const [backendEpoch, setBackendEpoch] = useState(0)
  const backendRef = useRef<FakeBackend | null>(null)

  const reportError = useCallback((error: Error | string) => {
    const message = typeof error === 'string' ? error : error.message
    postPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:error', message })
  }, [instanceId])

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (!isHostToPreviewMessage(event.data)) {
        reportError('Ignored malformed or unsupported preview message.')
        return
      }
      if (event.data.instanceId !== instanceId) return
      if (event.data.type === 'preview:init' || event.data.type === 'preview:update') {
        setState(event.data)
        return
      }
      if (event.data.type === 'preview:hydrate-backend') {
        backendRef.current?.hydrate(event.data.snapshot)
        setBackendEpoch((epoch) => epoch + 1)
        return
      }
      if (event.data.type === 'preview:reset') {
        backendRef.current?.reset()
        setBackendEpoch((epoch) => epoch + 1)
      }
    }
    window.addEventListener('message', onMessage)
    postPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [instanceId, reportError])

  const bundle = useMemo<RuntimeBundle | null>(() => {
    if (!state) return null
    const design = getDesignDefinition(state.designKey)
    if (!design) return null
    const builder = buildScenario(state.scenario)
    const backend = new FakeBackend(builder, new ActionLog(), state.flags.latencyMs)
    backend.failNextMutation = state.flags.failNextMutation
    backend.readError = state.flags.readError
    backend.loadingOverride = state.flags.loadingOverride
    backend.hydrate(state.backendSnapshot)
    const resolution = resolveDesignRuntime(design, state.config.raw, state.config.savedVersion)
    return { design, builder, backend, runtime: resolution.runtime }
  }, [state])

  useEffect(() => {
    backendRef.current = bundle?.backend ?? null
  }, [bundle])

  useEffect(() => {
    const backend = bundle?.backend
    if (!backend) return
    let cursor = backend.log.entries.length
    return backend.log.subscribe(() => {
      if (cursor > backend.log.entries.length) cursor = 0
      for (const entry of backend.log.entries.slice(cursor)) {
        postPreviewMessage({
          protocol: PREVIEW_PROTOCOL_VERSION,
          instanceId,
          type: 'preview:log',
          entry: { scope: entry.scope, action: entry.action, detail: entry.detail, level: entry.level },
        })
      }
      cursor = backend.log.entries.length
    })
  }, [bundle, instanceId])

  const handleNavigate = useCallback((href: string) => {
    postPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:navigate', href })
  }, [instanceId])
  const handleExternal = useCallback((href: string) => {
    postPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:external', href })
  }, [instanceId])
  const handleBackendSnapshot = useCallback((snapshot: FakeBackendSnapshot) => {
    postPreviewMessage({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:backend-snapshot', snapshot, localRevision: snapshot.revision })
  }, [instanceId])

  if (!state) return <div data-testid="preview-waiting" className="preview-waiting">Waiting for Lab host…</div>
  if (!bundle) {
    reportError(`Unknown Design: ${state.designKey}`)
    return <div data-testid="preview-error" className="preview-error"><strong>Design preview unavailable</strong><span>Unknown Design: {state.designKey}</span></div>
  }

  return (
    <PreviewErrorBoundary onError={reportError} key={`${state.designKey}:${state.surface}:${backendEpoch}`}>
      <PreviewRenderer
        design={bundle.design}
        builder={bundle.builder}
        backend={bundle.backend}
        runtime={bundle.runtime}
        surface={state.surface}
        params={state.params}
        viaCompat={state.viaCompat}
        onNavigate={handleNavigate}
        onExternal={handleExternal}
        onBackendSnapshot={handleBackendSnapshot}
      />
    </PreviewErrorBoundary>
  )
}
