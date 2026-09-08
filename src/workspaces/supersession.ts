/**
 * Pure supersession derivation (mirror of the production workspace helper):
 * turns flat, already-authorized edges into Design-neutral trees over rows.
 * No fetch, no authorization, no hidden neighbors.
 */
import type { RecordSummary, SupersessionEdge, SupersessionNode } from '../contracts'

export function olderByNewer(edges: SupersessionEdge[]): Map<number, number> {
  const out = new Map<number, number>()
  for (const edge of edges) out.set(edge.newerId, edge.olderId)
  return out
}

export function newerByOlder(edges: SupersessionEdge[]): Map<number, number> {
  const out = new Map<number, number>()
  for (const edge of edges) out.set(edge.olderId, edge.newerId)
  return out
}

export function buildSupersessionTrees(records: RecordSummary[], edges: SupersessionEdge[]): SupersessionNode[] {
  const byId = new Map(records.map((record) => [record.id, record]))
  const olderMap = olderByNewer(edges)
  const newerMap = newerByOlder(edges)
  const roots = new Map<number, SupersessionNode>()
  const buildTree = (recordId: number, visited = new Set<number>()): SupersessionNode | null => {
    const record = byId.get(recordId)
    if (!record || visited.has(recordId)) return null
    const nextVisited = new Set(visited).add(recordId)
    const olderId = olderMap.get(recordId)
    const child = olderId != null ? buildTree(olderId, nextVisited) : null
    return { record, children: child ? [child] : [] }
  }
  for (const record of records) {
    let rootId = record.id
    let guard = 0
    while (newerMap.has(rootId) && guard++ < records.length) rootId = newerMap.get(rootId)!
    const root = buildTree(rootId)
    if (root) roots.set(root.record.id, root)
  }
  return [...roots.values()]
}

export function isSuperseded(recordId: number, edges: SupersessionEdge[]): boolean {
  return edges.some((edge) => edge.olderId === recordId)
}