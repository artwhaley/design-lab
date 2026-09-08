import type { Universe } from './universe'

/**
 * Source-equivalent values used only by the visual oracle scenario. This is a
 * projection of existing generic fixture fields, not a second authorization
 * model and not a source import at runtime.
 */
export const OBSIDIAN_FIDELITY_PROFILE = 'obsidian-fidelity' as const

export const OBSIDIAN_HOME_WELCOME_HTML = `<p>At the edge of the known sea, a community takes shape. These are the stories, agreements, and discoveries that make it ours.</p><p>Welcome to Aster Reach. Explore our world, meet its people, and follow the record as it grows.</p>`

export const OBSIDIAN_ABOUT_BODY_HTML = `<p class="lead">Aster Reach begins after the voyage. It is a roleplaying community about the fragile work of building a life together in a place that still feels new.</p><p>Beyond the silver shoals, the Reach is a coast of stubborn settlements, shared harbors, unfinished maps, and people carrying histories they may not be ready to name. There is wonder here, but it is the wonder of ordinary things made meaningful: a lantern left burning, a council decision argued late into the night, a route across dangerous water known only to a few.</p><p>We make this world together. Every character arrives with a point of view; every relationship, trade, promise, and mistake gives the setting another edge. The lore is here to offer a common horizon. The stories are what we choose to do beneath it.</p>`

export const OBSIDIAN_DOCUMENT_BODY_HTML = `<p class="lead">An agreement on common ground, shared passage, and the care of the record. Adopted by the settlements of Aster Reach at the autumn assembly.</p><h2>01. A common shore</h2><p>We came to the Reach by different waters. Some carried the names of places that no longer appear on any chart. Some brought little more than a trade, a promise, or a reason to begin again. What joined us was not a shared past, but the possibility of a shared future.</p><p>This accord sets down the terms by which we hold that future together. It is an agreement between the settlements of Northwatch, the eastern passage, and the outer islands: that the coast shall remain open, that its records shall be kept in common, and that no person’s place in our story shall depend upon the strength of their voice.</p><p>The archive is not the property of those who keep it. It belongs to the community whose life it records. Its stewards accept a duty of care, not a claim of ownership.</p><blockquote>What we preserve is not only what happened, but the possibility of understanding one another.</blockquote><h2>02. The work of keeping</h2><p>A record should allow those who were absent to understand what took place. It should distinguish what was witnessed from what was reported, what was decided from what was proposed, and what is known from what remains uncertain.</p>`

export const OBSIDIAN_DOCUMENT_BODY_SOURCE = `An agreement on common ground, shared passage, and the care of the record. Adopted by the settlements of Aster Reach at the autumn assembly.

## 01. A common shore

We came to the Reach by different waters. Some carried the names of places that no longer appear on any chart. Some brought little more than a trade, a promise, or a reason to begin again. What joined us was not a shared past, but the possibility of a shared future.

This accord sets down the terms by which we hold that future together. It is an agreement between the settlements of Northwatch, the eastern passage, and the outer islands: that the coast shall remain open, that its records shall be kept in common, and that no person’s place in our story shall depend upon the strength of their voice.

The archive is not the property of those who keep it. It belongs to the community whose life it records. Its stewards accept a duty of care, not a claim of ownership.

> What we preserve is not only what happened, but the possibility of understanding one another.

## 02. The work of keeping

A record should allow those who were absent to understand what took place. It should distinguish what was witnessed from what was reported, what was decided from what was proposed, and what is known from what remains uncertain.`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function applyObsidianFidelityProfile(input: Universe): Universe {
  const universe = clone(input)
  universe.domain = {
    ...universe.domain,
    motto: 'What we remember, we become.',
    description: 'Aster Reach begins after the voyage. It is a roleplaying community about the fragile work of building a life together in a place that still feels new.',
    descriptionLong: 'Beyond the silver shoals, the Reach is a coast of stubborn settlements, shared harbors, unfinished maps, and people carrying histories they may not be ready to name.',
    logoUrl: null,
    bannerUrl: null,
    backgroundUrl: null,
  }
  universe.departments = [
    { id: 1, name: 'Northwatch Council', slug: 'northwatch-council', description: '7 members · civic office', archived: false },
    { id: 2, name: 'Harbor office', slug: 'harbor-office', description: '3 members · passage and mooring', archived: false },
    { id: 3, name: 'Survey corps', slug: 'survey-corps', description: '5 members · maps and field work', archived: false },
  ]
  universe.members = [
    { id: 1, name: 'Elara Voss', displayName: null, kind: 'player', status: 'active', avatarUrl: null, departmentIds: [1], roleIds: [1], controllerName: 'Morgan', controllerEmail: 'morgan@example.test' },
    { id: 2, name: 'Cael Ren', displayName: null, kind: 'player', status: 'active', avatarUrl: null, departmentIds: [3], roleIds: [3], controllerName: null, controllerEmail: null },
    { id: 3, name: 'Mira Sol', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [1], roleIds: [2], controllerName: null, controllerEmail: null },
    { id: 4, name: 'Sera Vale', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [2], roleIds: [1], controllerName: null, controllerEmail: null },
    { id: 5, name: 'Orren Pike', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [1], roleIds: [2], controllerName: null, controllerEmail: null },
    { id: 6, name: 'Lyra Fen', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [1], roleIds: [2], controllerName: null, controllerEmail: null },
    { id: 7, name: 'Kest Marrow', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [1], roleIds: [2], controllerName: null, controllerEmail: null },
    { id: 8, name: 'Niko Ardent', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [2], roleIds: [1], controllerName: null, controllerEmail: null },
    { id: 9, name: 'Vela Ohn', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [2], roleIds: [1], controllerName: null, controllerEmail: null },
    { id: 10, name: 'Imani Dorr', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [3], roleIds: [3], controllerName: null, controllerEmail: null },
    { id: 11, name: 'Tomas Rill', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [3], roleIds: [3], controllerName: null, controllerEmail: null },
    { id: 12, name: 'Wen Hara', displayName: null, kind: 'staff', status: 'active', avatarUrl: null, departmentIds: [3], roleIds: [3], controllerName: null, controllerEmail: null },
  ]
  universe.roles = [
    { id: 1, name: 'Archivist', departmentId: 1, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
    { id: 2, name: 'Council representative', departmentId: 1, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: true },
    { id: 3, name: 'Contributor', departmentId: 3, parentRoleId: null, folderRead: 'allow', folderWrite: 'allow', typeCreate: true, typeEdit: false },
  ]
  universe.folders = [
    { id: 1, name: 'Foundations', parentId: null, departmentId: 1, systemManaged: false, createdAt: 'Apr 14, 2026' },
    { id: 5, name: 'Earlier agreements', parentId: 1, departmentId: 1, systemManaged: false, createdAt: 'May 2, 2026' },
    { id: 2, name: 'The council', parentId: null, departmentId: 1, systemManaged: false, createdAt: 'May 18, 2026' },
    { id: 3, name: 'Expeditions', parentId: null, departmentId: 3, systemManaged: false, createdAt: 'Jul 7, 2026' },
    { id: 4, name: 'People & places', parentId: null, departmentId: 2, systemManaged: false, createdAt: 'Aug 20, 2026' },
  ]
  universe.documentTypes = [
    { id: 1, name: 'Accord', departmentRootId: 1, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
    { id: 2, name: 'Field report', departmentRootId: 3, parentFolderId: null, templateMode: 'form-to-markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
    { id: 3, name: 'Council minutes', departmentRootId: 1, parentFolderId: null, templateMode: 'markdown', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
    { id: 4, name: 'Charter', departmentRootId: 1, parentFolderId: null, templateMode: 'blank', archived: false, lifecycleStages: ['Draft', 'Submitted', 'Filed'] },
  ]
  universe.records = sourceRecords()
  universe.lore = sourceLore()
  universe.invitations = []
  universe.joinRequests = []
  universe.claimRequests = []
  universe.claimTargets = []
  universe.supersessionEdges = [{ newerId: 1, olderId: 7 }]
  return universe
}

function sourceRecords(): Universe['records'] {
  const rows = [
    ['The Northwatch Accord', 1, 1, 'filed', 1, '2026-09-28T12:00:00Z'],
    ['A survey of the outer islands', 3, 2, 'filed', 2, '2026-09-27T12:00:00Z'],
    ['Minutes of the autumn assembly', 2, 3, 'submitted', 3, '2026-09-26T12:00:00Z'],
    ['On the keeping of names', 1, 4, 'filed', 1, '2026-09-25T12:00:00Z'],
    ['The return of the Wayfarer', 4, 2, 'draft', 2, '2026-09-24T12:00:00Z'],
    ['Stewardship of the eastern passage', 2, 1, 'filed', 4, '2026-09-23T12:00:00Z'],
    ['The first Northwatch agreement', 5, 1, 'deprecated', 1, '2026-09-22T12:00:00Z'],
    ['Soundings beyond the silver shoals', 3, 2, 'filed', 2, '2026-09-21T12:00:00Z'],
    ['Appointments to the winter council', 2, 3, 'filed', 3, '2026-09-20T12:00:00Z'],
    ['A record of the lighthouse keepers', 4, 4, 'filed', 4, '2026-09-19T12:00:00Z'],
    ['Concerning the restoration of the northern observatory and its adjoining public archive', 2, 3, 'draft', 3, '2026-09-18T12:00:00Z'],
    ['The crossing at first light', 4, 2, 'filed', 2, '2026-09-17T12:00:00Z'],
  ]
  const departmentForFolder: Record<number, number> = { 1: 1, 2: 1, 3: 3, 4: 2, 5: 1 }
  const preparedBy = [1, 2, 3, 1, 2, 4, 1, 2, 3, 4, 3, 2]
  const extraFolderIds = [
    ...Array.from({ length: 10 }, () => 1),
    ...Array.from({ length: 5 }, () => 5),
    ...Array.from({ length: 20 }, () => 2),
    ...Array.from({ length: 10 }, () => 3),
    ...Array.from({ length: 15 }, () => 4),
  ]
  return Array.from({ length: 72 }, (_, index) => {
    const seed = rows[index % rows.length]
    const id = index + 1
    const folderId = index < rows.length ? seed[1] as number : extraFolderIds[index - rows.length]
    const typeId = seed[2] as number
    const lifecycle = (index < rows.length ? seed[3] : 'filed') as Universe['records'][number]['lifecycle']
    const title = index < rows.length ? seed[0] as string : `${seed[0] as string} · Volume ${Math.floor(index / rows.length) + 1}`
    return {
      id,
      title,
      folderId,
      documentTypeId: typeId,
      departmentId: departmentForFolder[folderId] ?? 1,
      preparedByMemberId: index < rows.length ? preparedBy[index] : ((index % 4) + 1),
      updatedAt: index < rows.length ? seed[5] as string : `2025-${String(12 - (index % 9)).padStart(2, '0')}-01T12:00:00Z`,
      lifecycle,
      locked: index === 3,
      tags: typeId === 1 ? ['Foundations', 'Common ground', 'Governance'] : [String(seed[0]).split(' ')[0].toLowerCase()],
      concerns: index === 0
        ? [{ name: 'The Northwatch Council', relationshipLabel: 'Adopting body' }, { name: 'Outer Islands', relationshipLabel: 'Signatory' }]
        : [],
      body: index === 0 ? OBSIDIAN_DOCUMENT_BODY_HTML : `<p>${title}</p>`,
      statusMessage: null,
    }
  })
}

function sourceLore(): Universe['lore'] {
  const rows = [
    ['The Reach at a glance', 'the-reach', 'The coast', 'The scattered settlements, the waters between them, and why no map of the Reach stays finished for long.', 'A foundational entry'],
    ['Northwatch', 'northwatch', 'The coast', 'A harbor settlement built around a working lighthouse, an open storehouse, and the habit of taking strangers seriously.', 'Revised this season'],
    ['The outer islands', 'outer-islands', 'The coast', 'Remote communities, shifting routes, and the islanders who navigate by patterns mainlanders have not learned to see.', 'Revised this season'],
    ['The autumn assembly', 'autumn-assembly', 'Civic life', 'The yearly gathering where the coast takes stock, settles what it can, and makes room for what remains unresolved.', 'A foundational entry'],
    ['Stewards and keepers', 'stewards-and-keepers', 'Civic life', 'The ordinary offices that keep shared places open, records legible, and responsibilities visible.', 'Revised this season'],
    ['Trade and passage', 'trade-and-passage', 'Daily life', 'What moves along the coast, who carries it, and the practical ethics of asking safe passage from a neighbor.', 'Revised this season'],
  ]
  return rows.map(([title, slug, group, summary, revisionLabel], index) => ({
    id: index + 1,
    title,
    slug,
    group,
    summary,
    revisionLabel,
    body: `<h1>${title}</h1><p>${summary}</p>`,
  }))
}
