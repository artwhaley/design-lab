/** Member/Character source entity. Public profile facts and management facts stay distinct in projections. */
export type MemberEntity = {
  id: number
  name: string
  displayName: string | null
  kind: 'player' | 'staff' | 'guest'
  status: 'active' | 'inactive'
  avatarUrl: string | null
  departmentIds: number[]
  roleIds: number[]
  /** Management-only: controlling user (never projected into public models). */
  controllerName: string | null
  controllerEmail: string | null
}

const avatar = (n: number): string | null => `/media/lab-fixtures/member-${n}.svg`

export const MEMBERS: readonly MemberEntity[] = [
  { id: 1, name: 'Captain Ilyas Vance', displayName: 'Ilyas Vance', kind: 'player', status: 'active', avatarUrl: avatar(1), departmentIds: [1], roleIds: [1, 9], controllerName: 'artwhaley', controllerEmail: 'artwhaley@example.test' },
  { id: 2, name: 'Dr. Amara Okonkwo', displayName: 'Amara Okonkwo', kind: 'player', status: 'active', avatarUrl: avatar(2), departmentIds: [5], roleIds: [2, 6], controllerName: 'amarao', controllerEmail: 'amarao@example.test' },
  { id: 3, name: 'Sergeant Tomas Ribeiro', displayName: 'Tomas Ribeiro', kind: 'staff', status: 'active', avatarUrl: avatar(3), departmentIds: [4], roleIds: [5], controllerName: null, controllerEmail: null },
  { id: 4, name: 'Registrar Priya Chandrasekhar', displayName: 'Priya Chandrasekhar', kind: 'player', status: 'active', avatarUrl: avatar(4), departmentIds: [3], roleIds: [2], controllerName: 'priyac', controllerEmail: 'priyac@example.test' },
  { id: 5, name: 'Cartographer Lena Voss', displayName: 'Lena Voss', kind: 'staff', status: 'active', avatarUrl: avatar(5), departmentIds: [2], roleIds: [3], controllerName: null, controllerEmail: null },
  { id: 6, name: 'Engineer Dario Mensah', displayName: 'Dario Mensah', kind: 'staff', status: 'active', avatarUrl: avatar(6), departmentIds: [7], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 7, name: 'Curator Esmé Laurent', displayName: 'Esmé Laurent', kind: 'player', status: 'active', avatarUrl: avatar(7), departmentIds: [6], roleIds: [7], controllerName: 'esmela', controllerEmail: 'esmela@example.test' },
  { id: 8, name: 'Pilot Juno Reyes', displayName: 'Juno Reyes', kind: 'staff', status: 'active', avatarUrl: avatar(8), departmentIds: [4], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 9, name: 'Archivist Marius Feld', displayName: 'Marius Feld', kind: 'staff', status: 'active', avatarUrl: avatar(9), departmentIds: [6], roleIds: [8], controllerName: null, controllerEmail: null },
  { id: 10, name: 'Surveyor Ada Lindqvist', displayName: 'Ada Lindqvist', kind: 'player', status: 'active', avatarUrl: avatar(10), departmentIds: [2], roleIds: [4], controllerName: 'adal', controllerEmail: 'adal@example.test' },
  { id: 11, name: 'Medic Sana Qureshi', displayName: 'Sana Qureshi', kind: 'staff', status: 'active', avatarUrl: avatar(11), departmentIds: [4], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 12, name: 'Linguist Felix Okafor', displayName: 'Felix Okafor', kind: 'player', status: 'active', avatarUrl: avatar(12), departmentIds: [5], roleIds: [6], controllerName: 'felixo', controllerEmail: 'felixo@example.test' },
  { id: 13, name: 'Botanist Hana Mori', displayName: 'Hana Mori', kind: 'staff', status: 'active', avatarUrl: avatar(13), departmentIds: [5], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 14, name: 'Navigator Ivo Petrov', displayName: 'Ivo Petrov', kind: 'staff', status: 'active', avatarUrl: avatar(14), departmentIds: [4], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 15, name: 'Steward Kira Yamamoto', displayName: 'Kira Yamamoto', kind: 'staff', status: 'active', avatarUrl: avatar(15), departmentIds: [1], roleIds: [9], controllerName: null, controllerEmail: null },
  { id: 16, name: 'Recorder Thabo Ndlovu', displayName: 'Thabo Ndlovu', kind: 'staff', status: 'active', avatarUrl: avatar(16), departmentIds: [3], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 17, name: 'Technician Elif Demir', displayName: 'Elif Demir', kind: 'staff', status: 'active', avatarUrl: avatar(17), departmentIds: [7], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 18, name: 'Scout Grey Castellanos', displayName: 'Grey Castellanos', kind: 'staff', status: 'active', avatarUrl: avatar(18), departmentIds: [4], roleIds: [5], controllerName: null, controllerEmail: null },
  { id: 19, name: 'Diplomat Renata Silva', displayName: 'Renata Silva', kind: 'player', status: 'active', avatarUrl: avatar(19), departmentIds: [3, 1], roleIds: [10, 9], controllerName: 'renatas', controllerEmail: 'renatas@example.test' },
  { id: 20, name: 'Historian Callum McTavish', displayName: 'Callum McTavish', kind: 'staff', status: 'active', avatarUrl: avatar(20), departmentIds: [6], roleIds: [8], controllerName: null, controllerEmail: null },
  { id: 21, name: 'Apprentice Rhea Sorn', displayName: 'Rhea Sorn', kind: 'guest', status: 'active', avatarUrl: avatar(21), departmentIds: [6], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 22, name: 'Courier Wes Callahan', displayName: 'Wes Callahan', kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [4], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 23, name: 'Retired Fleet Archivist Odessa Kane', displayName: 'Odessa Kane', kind: 'staff', status: 'inactive', avatarUrl: null, departmentIds: [6], roleIds: [], controllerName: null, controllerEmail: null },
  { id: 24, name: 'Guest Scholar Tova Lindgren', displayName: 'Tova Lindgren', kind: 'guest', status: 'active', avatarUrl: null, departmentIds: [5, 6], roleIds: [6, 8], controllerName: null, controllerEmail: null },
]

/** Stress variant names for long-content coverage. */
export function stressMemberName(id: number): string | null {
  const names: Record<number, string> = {
    1: 'Captain Ilyas Vance, Senior Steward of the Outer Belt Survey Commission for Aster Reach and Its Associated Settlements',
    7: 'Curator Esmé Laurent, Keeper of Public Histories and Special Collections for the Heritage & Records Directorate',
    10: 'Surveyor Ada Lindqvist, Principal Cartographic Field Surveyor, Second Survey Wing, Aster Belt Division',
  }
  return names[id] ?? null
}

export function memberById(id: number): MemberEntity {
  const found = MEMBERS.find((m) => m.id === id)
  if (!found) throw new Error(`Unknown member id ${id}`)
  return found
}