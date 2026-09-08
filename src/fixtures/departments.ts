/** Department source entities. `archived` drives management + public listing. */
export type DepartmentEntity = {
  id: number
  name: string
  slug: string
  description: string | null
  archived: boolean
}

export const DEPARTMENTS: readonly DepartmentEntity[] = [
  { id: 1, name: 'High Council', slug: 'high-council', description: 'The governing council of Aster Reach: charters, directives, and the stewardship of the settlement.', archived: false },
  { id: 2, name: 'Survey & Cartography', slug: 'survey-cartography', description: 'Charts the belt, keeps the maps, and files the survey reports that keep expeditions honest.', archived: false },
  { id: 3, name: 'Colonial Registry', slug: 'colonial-registry', description: 'Census ledgers, land grants, trade accords, and the official identity of every resident.', archived: false },
  { id: 4, name: 'Expedition Corps', slug: 'expedition-corps', description: 'Plans and conducts expeditions; every expedition returns with a logbook or not at all.', archived: false },
  { id: 5, name: 'Xenological Studies', slug: 'xenological-studies', description: 'Documents the biology, language, and artifacts of the things the belt has to offer.', archived: false },
  { id: 6, name: 'Heritage & Records', slug: 'heritage-records', description: 'The archive\'s archive: public histories, personnel records, and the care of the collection.', archived: false },
  { id: 7, name: 'Orbital Works', slug: 'orbital-works', description: 'Former orbital construction corps, archived after the drydock decommission.', archived: true },
]

export const DEPARTMENT_VOCABULARY = {
  subdomainSingular: 'Department',
  subdomainPlural: 'Departments',
  roleSingular: 'Role',
  folderPlural: 'Folders',
  memberPlural: 'Members',
}

export function departmentById(id: number): DepartmentEntity {
  const found = DEPARTMENTS.find((d) => d.id === id)
  if (!found) throw new Error(`Unknown department id ${id}`)
  return found
}