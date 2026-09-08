/** Folder source entity. `systemManaged` folders cannot be renamed/moved/deleted. */
export type FolderEntity = {
  id: number
  name: string
  parentId: number | null
  departmentId: number
  systemManaged: boolean
  createdAt: string
}

export const FOLDERS: readonly FolderEntity[] = [
  // 1 Administration (system-managed root)
  { id: 1, name: 'Administration', parentId: null, departmentId: 1, systemManaged: true, createdAt: '2024-01-04T09:00:00.000Z' },
  { id: 2, name: 'Council Records', parentId: 1, departmentId: 1, systemManaged: false, createdAt: '2024-01-05T10:00:00.000Z' },
  { id: 3, name: 'Session Minutes', parentId: 2, departmentId: 1, systemManaged: false, createdAt: '2024-02-01T11:00:00.000Z' },
  { id: 4, name: 'Personnel', parentId: 1, departmentId: 1, systemManaged: true, createdAt: '2024-01-06T12:00:00.000Z' },
  { id: 5, name: 'Active Staff', parentId: 4, departmentId: 1, systemManaged: false, createdAt: '2024-01-07T13:00:00.000Z' },
  { id: 6, name: 'Retired Staff', parentId: 4, departmentId: 1, systemManaged: false, createdAt: '2024-01-08T14:00:00.000Z' },
  { id: 23, name: 'Oversight Committee', parentId: 1, departmentId: 1, systemManaged: false, createdAt: '2025-03-02T09:00:00.000Z' },

  // 2 Expeditions
  { id: 7, name: 'Expeditions', parentId: null, departmentId: 4, systemManaged: false, createdAt: '2024-01-10T09:00:00.000Z' },
  { id: 8, name: 'Survey Wing', parentId: 7, departmentId: 4, systemManaged: false, createdAt: '2024-02-11T10:00:00.000Z' },
  { id: 9, name: 'Aster Belt Surveys', parentId: 8, departmentId: 2, systemManaged: false, createdAt: '2024-03-12T11:00:00.000Z' },
  { id: 10, name: 'First Contact Archive', parentId: 7, departmentId: 4, systemManaged: false, createdAt: '2024-04-13T12:00:00.000Z' },

  // 3 Colonies
  { id: 11, name: 'Colonies', parentId: null, departmentId: 3, systemManaged: false, createdAt: '2024-01-12T09:00:00.000Z' },
  { id: 12, name: 'New Harrow', parentId: 11, departmentId: 3, systemManaged: false, createdAt: '2024-02-14T10:00:00.000Z' },
  { id: 13, name: 'Land Grants', parentId: 12, departmentId: 3, systemManaged: false, createdAt: '2024-03-15T11:00:00.000Z' },
  { id: 14, name: 'Trade Routes', parentId: 11, departmentId: 3, systemManaged: false, createdAt: '2024-04-16T12:00:00.000Z' },
  { id: 24, name: 'Trade Routes Archive', parentId: 11, departmentId: 3, systemManaged: false, createdAt: '2025-06-01T09:00:00.000Z' },

  // 4 Xenology
  { id: 15, name: 'Xenology', parentId: null, departmentId: 5, systemManaged: false, createdAt: '2024-01-15T09:00:00.000Z' },
  { id: 16, name: 'Specimen Logs', parentId: 15, departmentId: 5, systemManaged: false, createdAt: '2024-02-18T10:00:00.000Z' },
  { id: 17, name: 'Flora', parentId: 16, departmentId: 5, systemManaged: false, createdAt: '2024-03-20T11:00:00.000Z' },
  { id: 18, name: 'Fauna', parentId: 16, departmentId: 5, systemManaged: false, createdAt: '2024-04-22T12:00:00.000Z' },
  { id: 19, name: 'Field Recordings', parentId: 15, departmentId: 5, systemManaged: false, createdAt: '2024-05-24T13:00:00.000Z' },

  // 5 Heritage (system-managed root)
  { id: 20, name: 'Heritage', parentId: null, departmentId: 6, systemManaged: true, createdAt: '2024-01-18T09:00:00.000Z' },
  { id: 21, name: 'Public Histories', parentId: 20, departmentId: 6, systemManaged: false, createdAt: '2024-02-20T10:00:00.000Z' },
  { id: 22, name: 'Restricted Histories', parentId: 20, departmentId: 6, systemManaged: false, createdAt: '2024-03-22T11:00:00.000Z' },

  // 6 Ephemera
  { id: 25, name: 'Ephemera', parentId: null, departmentId: 6, systemManaged: false, createdAt: '2024-05-01T09:00:00.000Z' },
  { id: 26, name: 'Letters', parentId: 25, departmentId: 6, systemManaged: false, createdAt: '2024-05-02T10:00:00.000Z' },
  { id: 27, name: 'Photographs', parentId: 25, departmentId: 6, systemManaged: false, createdAt: '2024-05-03T11:00:00.000Z' },
  { id: 28, name: 'Expedition Photos', parentId: 27, departmentId: 6, systemManaged: false, createdAt: '2024-05-04T12:00:00.000Z' },

  // 7 Pending Digitization (empty root)
  { id: 29, name: 'Pending Digitization', parentId: null, departmentId: 6, systemManaged: false, createdAt: '2025-01-10T09:00:00.000Z' },
]

export function folderById(id: number): FolderEntity {
  const found = FOLDERS.find((f) => f.id === id)
  if (!found) throw new Error(`Unknown folder id ${id}`)
  return found
}

export function childrenOf(folderId: number): FolderEntity[] {
  return FOLDERS.filter((f) => f.parentId === folderId)
}

/** Deepest nesting depth (root = 1) over the tree. */
export function maxFolderDepth(): number {
  const depthOf = (id: number | null, depth: number): number => {
    const children = FOLDERS.filter((f) => f.parentId === id)
    if (children.length === 0) return depth
    return Math.max(...children.map((c) => depthOf(c.id, depth + 1)))
  }
  return depthOf(null, 1)
}

/** Stress variant: extra deeply-nested chain (4+ levels) under Survey Wing. */
export const STRESS_FOLDER_CHAIN: readonly FolderEntity[] = [
  { id: 101, name: 'Sector 7 Charts', parentId: 9, departmentId: 2, systemManaged: false, createdAt: '2025-02-01T09:00:00.000Z' },
  { id: 102, name: 'Sector 7 / Grid 14 / Survey Pass Four — Uncorrected Field Plots and Raw Telemetry Extracts Awaiting Reduction', parentId: 101, departmentId: 2, systemManaged: false, createdAt: '2025-02-02T09:00:00.000Z' },
  { id: 103, name: 'Grid 14 Subquadrant Archive', parentId: 102, departmentId: 2, systemManaged: false, createdAt: '2025-02-03T09:00:00.000Z' },
]