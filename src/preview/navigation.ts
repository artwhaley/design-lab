const PATH_EVENT = 'loreforge:preview-path'
const NAVIGATE_EVENT = 'loreforge:preview-navigate'
const REFRESH_EVENT = 'loreforge:preview-refresh'

let currentPath = '/'

export function getPreviewPath(): string {
  return currentPath
}

export function setPreviewPath(path: string): void {
  const normalized = path || '/'
  if (currentPath === normalized) return
  currentPath = normalized
  window.dispatchEvent(new Event(PATH_EVENT))
}

export function subscribePreviewPath(listener: () => void): () => void {
  window.addEventListener(PATH_EVENT, listener)
  return () => window.removeEventListener(PATH_EVENT, listener)
}

export function navigatePreviewPath(href: string): void {
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: href }))
}

export function refreshPreview(): void {
  window.dispatchEvent(new Event(REFRESH_EVENT))
}

export function onPreviewNavigate(listener: (href: string) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail)
  window.addEventListener(NAVIGATE_EVENT, handler)
  return () => window.removeEventListener(NAVIGATE_EVENT, handler)
}

export function onPreviewRefresh(listener: () => void): () => void {
  window.addEventListener(REFRESH_EVENT, listener)
  return () => window.removeEventListener(REFRESH_EVENT, listener)
}
