# Design Lab Contract Baseline

## Current authority

The production checkout is the authority for the portable Design contract:

- production: `../sl-civic-archive`
- production branch: `patch/design-contract-management-and-obsidian`
- Lab contract version: `2026-09-management-v1`
- Design manifest and contract version: `1`

The exact mirrored production modules are checked by
`npm run parity:check-production -- --production <path>`. The complete
Obsidian folder and materialized assets are checked by
`npm run parity:folder -- --production <path> --check-assets`.

The Lab is a host for production Design folders, not a second Design API.
Authors should import production-shaped paths used by the portable folder.
Lab-only fixtures, fake workspaces, route simulation, API/form interception,
and Next shims live outside `src/designs/<key>/`.

## Required production slot tree

Every first-class Design supplies:

```text
Shell
pages.home
pages.records
pages.document
pages.departments
pages.department
pages.about
pages.lore
pages.members
pages.work
pages.management.departments
pages.management.folders
pages.management.roles
pages.management.documentTypes
pages.management.people
pages.management.person
pages.management.invitations
```

There is no production `pages.member` slot. A member directory is a
collection surface; a person workspace is the management-person surface.

### Optional `pages.characterProfile`

`pages.characterProfile` is an OPTIONAL slot (see
`CharacterProfilePageModel`): a Design that implements it owns
`/domain/[slug]/characters/[id]`; a Design that omits it receives the route's
Design-neutral fallback. The route never branches on which Design is active.
Optional slots never affect requiredness — the required set stays the 16
Class A surfaces above. The Lab previews the slot under the non-required
`character-profile` surface key (`/domain/[slug]/characters/[id]` in the path
simulator).

## Host contract inventory

The Lab mirrors dependency-light production modules for:

- Design assets, contracts, types, validation, and deterministic fixtures;
- common, public, and management Page Models;
- Records workspace types, projection, actions, and supersession behavior;
- document lifecycle/type-tree types;
- Studio fields and production action bridges.

The Lab supplies shims outside `src/designs/obsidian/` for:

- iframe navigation and Next link/navigation behavior;
- fake backend workspaces and mutation transport;
- OperatingContext rendering and the shared operational fallback body;
- the browser-side API/form emulator.

These shims preserve production call shapes. Unknown `/api/*` endpoints and
unsupported methods report an error to the host instead of silently succeeding.

## Surface truth

Class A surfaces are the 16 production slots above. Class B surfaces remain
shared functional placeholders. Review is a compatibility route that
redirects to Work in production (`compat.review → work` in the Lab) and
Subdomains maps to Departments. `character-profile` is a non-required surface
for previewing the optional `pages.characterProfile` slot.

## Authorized mutation/query seam

A Design may reference only the server-authorized API endpoints below, either
as `fetch`/form posts or as the documented `hostActionBridges` server actions
(`issueInvitationAction`, `duplicateTypeAction`, `setDocumentTypeArchivedAction`).
Anything else under `/api/*` is a boundary error, enforced by
`npm run design:audit` (`scripts/audit-design-packages.mjs`):

```text
/api/folders
/api/departments
/api/role-assignments
/api/character-claims
/api/invitations/revoke
/api/invitations/join-decision
/api/records-search (GET)
```

The Lab's production action emulator serves every endpoint on this seam (a
unit test asserts the invariant), and unknown endpoints fail loudly instead
of silently succeeding.

## Fixture policy

The Lab fixture universe is deterministic and intentionally separate from live
production database content. The `production-preview` profile uses the
deterministic production fixture oracle for the parity gate. Fixture names and
counts may differ in other authoring scenarios, but the cross-host parity gate
must compare identical semantic inputs, config, theme, assets, fonts, and
pathname. It compares raw pixels and canonicalized DOM; text, labels, links,
classes, styles, and content are not masked. Only documented runtime-only
noise is normalized.

The current approved evidence is 16 Class A surfaces plus the optional
character-profile surface at three viewports (51 comparisons): 1440×1000,
1024×900, and 390×844, with zero pixel, DOM, asset, and semantic-input
mismatches. The DOM comparator normalizes CSS-module hash suffixes
(`{fileBase}-module__{hash}__{local}` → `{fileBase}-module__{local}`) so any
Design's `.module.css` compares cleanly between hosts without per-Design pins.

## Refresh semantics

Refreshing the preview iframe (or a mutation-triggered re-render) re-sends the FULL current
preview state — design key, surface, params, config draft, scenario, and
backend snapshot — through `preview:init`, and the renderer rebuilds from that
state. An iframe refresh therefore cannot reset the preview to Home, drop the selected
Design, or blank the iframe (the earlier white-screen failure mode): the host
state is authoritative and replayed after every reload.

Refreshing the entire Lab page is different: its in-memory surface/scenario
selection resets. Saved per-Design configuration banks remain in local storage.
Do not describe whole-page refresh as durable session restoration.

## Functional portability acceptance (current)

The owner requires runnable folders, not identical hashes. Use the workflow in
`../../FUNCTIONAL_DESIGN_PORTABILITY.md`. Source/asset hash gates remain optional
diagnostics. A copied folder's `.design-local/` files are neither required nor
compiled by the other host. Live evidence is per Design and must be generated
before claiming a fresh pass; older 48/51-comparison claims are historical.

## Change policy

Production wins when concepts conflict. Lab adaptations belong in host shims,
fixtures, emulators, or route translation. A production contract change is
allowed only when the production implementation itself requires it; update the
mirror allowlist, tests, and the relevant execution note together.
