import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { SurfaceKey } from '../contracts'
import type { ScenarioSpec } from '../fixtures'
import type { FakeBackendSnapshot } from '../workspaces'
import type { Viewport } from './PreviewPane'
import type { LabRuntimeFlags } from './LabApp'
import type { SurfaceParams } from './PathSimulator'
import {
  PREVIEW_PROTOCOL_VERSION,
  isPreviewToHostMessage,
  type HostToPreviewMessage,
  type PreviewState,
} from '../preview/protocol'

type Props = {
  testId: string
  instanceId: string
  designKey: string
  surface: SurfaceKey
  params: SurfaceParams
  viaCompat?: 'review' | 'subdomains'
  scenario: ScenarioSpec
  flags: LabRuntimeFlags
  config: PreviewState['config']
  backendSnapshot: FakeBackendSnapshot
  authoritativeHydrate?: {
    snapshot: FakeBackendSnapshot
    sourceInstanceId: string
    token: number
  }
  viewport: Viewport | null
  onNavigate(href: string): void
  onExternal(href: string): void
  onBackendSnapshot?(snapshot: FakeBackendSnapshot, sourceInstanceId: string): void
  onLog?(entry: { scope: string; action: string; detail: string; level: 'info' | 'error' }, sourceInstanceId: string): void
  onReady?(instanceId: string): void
  onError?(message: string): void
}

export function IframePreviewPane(props: Props) {
  const {
    testId, instanceId, designKey, surface, params, viaCompat, scenario, flags, config, backendSnapshot, authoritativeHydrate, viewport,
    onNavigate, onExternal, onBackendSnapshot, onLog, onReady, onError,
  } = props
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [ready, setReady] = useState(false)
  const initializedRef = useRef(false)
  const lastHydrateTokenRef = useRef<number | null>(null)
  const state = useMemo<PreviewState>(() => ({
    designKey,
    surface,
    params,
    ...(viaCompat ? { viaCompat } : {}),
    scenario,
    flags,
    config,
    backendSnapshot,
  }), [backendSnapshot, config, designKey, flags, params, scenario, surface, viaCompat])

  const send = useCallback((message: HostToPreviewMessage): void => {
    const target = iframeRef.current?.contentWindow
    if (target) target.postMessage(message, window.location.origin)
  }, [])

  const sendInit = useCallback(() => {
    send({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:init', ...state })
  }, [instanceId, send, state])

  useEffect(() => {
    setReady(false)
    initializedRef.current = false
  }, [instanceId])

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return
      if (!isPreviewToHostMessage(event.data)) {
        onError?.('Ignored malformed or unsupported preview response.')
        return
      }
      if (event.data.instanceId !== instanceId) return
      switch (event.data.type) {
        case 'preview:ready':
          setReady(true)
          initializedRef.current = true
          onReady?.(instanceId)
          sendInit()
          break
        case 'preview:navigate':
          onNavigate(event.data.href)
          break
        case 'preview:external':
          onExternal(event.data.href)
          break
        case 'preview:backend-snapshot':
          onBackendSnapshot?.(event.data.snapshot, instanceId)
          break
        case 'preview:log':
          onLog?.(event.data.entry, instanceId)
          break
        case 'preview:error':
          onError?.(event.data.message)
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [instanceId, onBackendSnapshot, onError, onExternal, onLog, onNavigate, onReady, sendInit])

  useEffect(() => {
    if (ready && initializedRef.current) {
      send({ protocol: PREVIEW_PROTOCOL_VERSION, instanceId, type: 'preview:update', ...state })
    }
  }, [instanceId, ready, send, state])

  useEffect(() => {
    if (!ready || !initializedRef.current || !authoritativeHydrate || authoritativeHydrate.sourceInstanceId === instanceId) return
    if (authoritativeHydrate.token === lastHydrateTokenRef.current) return
    lastHydrateTokenRef.current = authoritativeHydrate.token
    send({
      protocol: PREVIEW_PROTOCOL_VERSION,
      instanceId,
      type: 'preview:hydrate-backend',
      snapshot: authoritativeHydrate.snapshot,
      sourceInstanceId: authoritativeHydrate.sourceInstanceId,
    })
  }, [authoritativeHydrate, instanceId, ready, send])

  const style: CSSProperties = {
    display: 'block',
    border: 0,
    background: '#fff',
    width: viewport ? `${viewport.width}px` : '100%',
    height: viewport ? `${viewport.height}px` : '100%',
  }

  return (
    <div data-testid={testId} className="lab-iframe-preview">
      <iframe
        ref={iframeRef}
        title={`${designKey} preview`}
        src={`/preview.html?instanceId=${encodeURIComponent(instanceId)}`}
        data-testid="preview-iframe"
        data-preview-instance-id={instanceId}
        scrolling="yes"
        onLoad={sendInit}
        style={style}
      />
    </div>
  )
}
