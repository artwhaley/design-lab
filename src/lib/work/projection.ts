export type WorkEntry = {
  kind: 'document' | 'join' | 'claim'
  id: number
  title: string
  summary: string
  href?: string
  requestedAt?: string | null
  domainId: number
  folderName?: string | null
}
export type PlatformWork = { authorized: boolean; entries: WorkEntry[] }
export type DomainWork = { authorized: boolean; domainAdmin: boolean; entries: WorkEntry[] }
