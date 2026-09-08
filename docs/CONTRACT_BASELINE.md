# Design Lab Contract Baseline

Frozen at **T00** of the LoreForge Design Lab v1 execution packet.

## Lab contract version

```
LAB_CONTRACT_VERSION = '2026-09-management-v1'
```

This is the single answer to "what contract is the Lab emulating?". The Lab owns
a dependency-free pure TypeScript snapshot under `src/contracts/` (Architecture
Decision A03). It imports no Payload, Next, Node-only, or server modules.

## Baseline commits

| Source | Location | Branch | HEAD |
|---|---|---|---|
| Production app (management contract work) | `../sl-civic-archive` | `patch/design-contract-management-and-obsidian` | `91b0383` (OBSIDIAN-T06: contract people + person workspaces) |
| Design Bible | `LoreForge_Design_Lab_Execution_Packet/reference/DESIGN_BIBLE_CURRENT.md` (workspace) | — | — |
| Obsidian visual incubation | `../obsidian-incubation` | `design/obsidian-incubation` | `fc22e6c` (Make department charts read-only and add character profiles) |

The workspace root is not itself a git repository; `design-lab/` is a
self-contained package that happens to sit next to the production checkout.
Reconciliation at T12 re-checks the latest landed management-contract commit.

## Latest completed management-contract state (observed at T00)

The parallel management-contract stack (`patch/design-contract-management-and-obsidian`)
has landed through OBSIDIAN-T06. Confirmed production shapes used as the naming
basis for the Lab snapshot:

- `DesignDefinition<TConfig>` in `src/lib/design/types.ts` with pages
  `home | records | document | departments | department | about | lore` plus
  `work?`, `members?`, and `management?` slots that are still **optional** in
  production (requiredness ladder not yet flipped).
- Page Models in `src/lib/page-models/`:
  `DomainShellModel`, `HomePageModel`, `RecordsPageModel`, `DocumentPageModel`,
  `DepartmentsPageModel`, `DepartmentPageModel`, `AboutPageModel`,
  `LorePageModel`, `MembersPageModel`, and management models
  `DepartmentsManagementPageModel`, `FolderManagementPageModel`,
  `RoleManagementPageModel`, `DocumentTypesManagementPageModel`,
  `PeopleManagementPageModel`, `PersonManagementPageModel`,
  `InvitationsManagementPageModel`, `WorkPageModel`.
- Records interactive seam `useRecordsWorkspace(model)` in
  `src/lib/records/workspace/` (search / folders / results / selection /
  actions / exposure / capabilities).
- Action descriptors in `src/lib/records/presentation/operations.ts`
  (`RecordActionDescriptor`, `FolderActionDescriptor`).
- Base theme tokens `BASE_THEME_VARS` serialized as `--tenant-*`
  (primary, secondary, accent, page-bg, surface-bg, surface-border,
  text-on-primary, heading-font, body-font, muted-text) in
  `src/lib/design/contracts.ts`.
- Validated config propagation as a `designConfig` prop plus resolved theme
  tokens (OBSIDIAN-T02); Studio editor receives `value / onChange / domain /
  uploadAsset` (P08D-T05).

## Lab surface inventory (target, per Design Bible §15)

Class A — required Design-owned slots (all **required** in the Lab from day one):

```
home  records  document  departments  department  about  lore  members
member  work
management.departments  management.folders  management.roles
management.documentTypes  management.people  management.person
management.invitations
```

Class B — shared functional/editor placeholders rendered inside the selected
Design Shell:

```
shared.forms  shared.templates  shared.import  shared.documentEdit
shared.documentHistory  shared.pageEdit  shared.siteStudio
```

Compatibility mappings:

```
/domain/[slug]/review       -> work semantics (no separate slot)
/domain/[slug]/subdomains   -> departments (redirect; no slot)
```

Class C — global/out-of-contract (documented, not rendered):

```
login/auth, account dashboard, billing, platform administration, Payload admin
```

## Workspace inventory (fake shared behavior owned by the Lab host)

```
records          RecordsWorkspace (search/folder/subfolders/type/order/batch/load-more)
documents        DocumentActionBridge (supplied action descriptors + local mutations)
folders          FoldersManagementWorkspace
roles            RolesManagementWorkspace
documentTypes    DocumentTypesManagementWorkspace
people           PeopleManagementWorkspace
person           PersonManagementWorkspace
departments      DepartmentsManagementWorkspace
invitations      InvitationsManagementWorkspace
work             WorkWorkspace
```

## Known transitional gaps (T00 snapshot vs Design Bible target)

1. **Requiredness.** Production `members`, `work`, and `management.*` slots are
   still optional; the Lab requires them (Bible §7 target state).
2. **Domain member profile.** Production has no canonical Domain-local public
   `member`/profile slot (Obsidian incubation used a character profile in its
   preview). The Lab defines `pages.member` per Bible §26.
3. **Records query contract.** Production Records workspace does not yet expose
   explicit ordering or requested batch/page-size vocabulary; the Lab snapshot
   carries neutral `ordering` ('newest' | 'oldest' | 'title') and `pageSize`
   terms per Bible §19, to be reconciled with the production Records query
   patch at T12.
4. **Lore expansion.** Production `LorePageModel` is a stub (baseUrl +
   destinations). The Lab snapshot implements the Bible §24 visibility-safe
   index (entries, group labels, summaries, revision labels, routes).
5. **Design runtime shape.** Production passes `designConfig` + theme tokens;
   the Lab bundles them as `DesignRuntime<TConfig> = { config, theme, cssVars }`
   for snapshot simplicity. Rendering equivalence is preserved.
6. **Review/Work and Subdomains/Departments.** Compatibility route semantics
   confirmed; the Lab simulates them in its path simulator.

## Decisions recorded

- The Lab emulates the **consumer side** only: safe Page Models + fake
  workspaces. It never evaluates authorization (A02, A07).
- One coherent fixture universe: **Aster Reach** (`/domain/aster-reach/...`)
  (A06).
- `localStorage` persistence for per-Design config banks, Lab-prefixed and
  versioned (A15).
- No React Router; finite surface catalog + browser history (A08).
- Class B surfaces are placeholders, not fake editors (A10).
- Contract changes after T02 require: a pressure note, a test update, a
  contract-version decision, and acknowledgement in the ticket execution note
  (Guardrail 16).