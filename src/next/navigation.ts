import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { getPreviewPath, navigatePreviewPath, refreshPreview, subscribePreviewPath } from '../preview/navigation'

export function usePathname(): string {
  return useSyncExternalStore(subscribePreviewPath, () => getPreviewPath().split('?')[0] || '/', () => '/')
}

export function useSearchParams(): URLSearchParams {
  const value = useSyncExternalStore(subscribePreviewPath, getPreviewPath, () => '')
  return useMemo(() => new URL(value, window.location.origin).searchParams, [value])
}

export function useRouter() {
  const push = useCallback((href: string) => navigatePreviewPath(href), [])
  return useMemo(() => ({
    push,
    replace: push,
    refresh: refreshPreview,
  }), [push])
}
