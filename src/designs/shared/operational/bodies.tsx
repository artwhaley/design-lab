'use client'

import type { PersonManagementPageModel } from '@/lib/page-models/management/people'
import { FolderTree, RoleTree } from '@/components/people/PersonAccessTrees'
import personStyles from '@/components/people/PersonWorkspace.module.css'

/** Lab mirror of the production shared Person workspace body. */
export function PersonBody(model: PersonManagementPageModel) {
  const displayName = model.localDisplayName || model.character.name
  return (
    <section className={personStyles.page}>
      <p className={personStyles.crumb}><a href={`/domain/${model.domainSlug}/manage/people`}>People</a> / {displayName}</p>
      <header className={personStyles.identityHeader}>
        <div className={personStyles.nameLine}><h1>{displayName}</h1><span className={personStyles.characterHandle}>{model.controller?.name || model.controller?.email || 'Unclaimed Character'}</span></div>
        {model.canManageMembers ? <form action="/api/domain-memberships" method="post" className={personStyles.removeForm}><input type="hidden" name="domainSlug" value={model.domainSlug} /><input type="hidden" name="characterId" value={model.character.id} /><input type="hidden" name="action" value="remove" /><button type="submit">Remove from Domain</button></form> : null}
      </header>
      <RoleTree domainSlug={model.domainSlug} characterId={model.character.id} departments={model.roleDepartments} initialMode={model.roleFilter} />
      <section className={personStyles.typeAccess} aria-labelledby="type-access-heading">
        <div className={personStyles.detailHeading}><h2 id="type-access-heading">Record Type access</h2><p className={personStyles.panelMeta}>Effective access for {displayName}, from Type grants and any Folder restrictions.</p></div>
        {model.typeAccess.length === 0 ? <p className={personStyles.panelMeta}>No active Document Types in this Domain.</p> : <table className={personStyles.typeTable}><thead><tr><th>Document Type</th><th>Read</th><th>Create</th><th>Edit</th><th>Source</th></tr></thead><tbody>{model.typeAccess.map((type) => <tr key={type.id}><td className={personStyles.typeName}>{type.name}</td><td>{type.read.allowed ? 'Allowed' : 'Denied'}</td><td>{type.create.allowed ? 'Allowed' : 'Denied'}</td><td>{type.edit.allowed ? 'Allowed' : 'Denied'}</td><td className={personStyles.typeSource}>{type.read.source}</td></tr>)}</tbody></table>}
      </section>
      <FolderTree domainSlug={model.domainSlug} characterId={model.character.id} folders={model.folderNodes} />
      <section className={personStyles.recentWork}><h2>Recent Work</h2><p>Recent work will appear here when the activity feed is connected.</p></section>
    </section>
  )
}
