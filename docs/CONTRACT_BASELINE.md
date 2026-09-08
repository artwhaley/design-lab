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
shared functional placeholders. Review maps to Work and Subdomains maps to
Departments. Character-profile deep links are external to the production
Design surface catalog; the Lab does not invent a singular `member` page.

## Fixture policy

The Lab fixture universe is deterministic and intentionally separate from live
production database content. The `production-preview` profile uses the
deterministic production fixture oracle for the parity gate. Fixture names and
counts may differ in other authoring scenarios, but the cross-host parity gate
must compare identical semantic inputs, config, theme, assets, fonts, and
pathname. It compares raw pixels and canonicalized DOM; text, labels, links,
classes, styles, and content are not masked. Only documented runtime-only
noise is normalized.

The current approved evidence is 16 Class A surfaces at three viewports (48
comparisons): 1440×1000, 1024×900, and 390×844, with zero pixel, DOM, asset,
and semantic-input mismatches.

## Change policy

Production wins when concepts conflict. Lab adaptations belong in host shims,
fixtures, emulators, or route translation. A production contract change is
allowed only when the production implementation itself requires it; update the
mirror allowlist, tests, and the relevant execution note together.
