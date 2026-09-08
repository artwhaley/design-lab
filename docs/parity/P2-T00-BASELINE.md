# P2-T00 production oracle baseline

Captured 2026-09-08 from the working checkouts after the owner-approved Phase 1 gate.

| checkout | branch | exact HEAD | Obsidian tree hash |
| --- | --- | --- | --- |
| production (`sl-civic-archive`) | `patch/design-contract-management-and-obsidian` | `a49cabed490576589a887734768e06c7b8d6680b` | `7d7df76af67dc2bfbd669f6a11a6f9ca248338dceacf2720e868425bf2bcbaeb` |
| Lab (`design-lab`) | `fix/obsidian-fidelity-remediation` | `b69f7053312c4048171a83768fac6f4803506a57` | `7d7df76af67dc2bfbd669f6a11a6f9ca248338dceacf2720e868425bf2bcbaeb` |

The tree hash is SHA-256 over sorted `relative-path NUL file-sha256` records. The exact recursive folder comparison is enforced by `npm run parity:folder -- --production <path> --check-assets`.

## Frozen production truth

- Manifest and Design contract version: `manifestVersion: 1`, `designContractVersion: 1`.
- Installable key: `obsidian`; entry: `./index.ts`; bundled thumbnail: `assets/thumbnail.svg`.
- Canonical primary navigation segments and order: `''`, `about`, `lore`, `departments`, `records`.
- Production Design slot tree: `Shell`; `pages.home`, `records`, `document`, `departments`, `department`, `about`, `lore`, `members`, `work`; and `pages.management.departments`, `folders`, `roles`, `documentTypes`, `people`, `person`, `invitations`.
- There is no `pages.member` slot in the production `DesignDefinition`.
- Default asset URL namespace: `/design-assets/obsidian/<relative asset path>`; Studio overrides use the production `DesignAssetRef` shape and `/media/...` references.
- Deterministic production fixtures are available under `src/lib/design/fixtures.ts` and the production page-model modules under `src/lib/page-models/**`.

## Obsidian host dependency inventory

The production portability audit identifies these generic host modules and shared visible support modules:

- Design contract/config: `@/lib/design/assets`, `contracts`, `types`, `validate`, `hostActionBridges`.
- Theme: `@/lib/theme/color`, `@/lib/theme/fonts`.
- Page models: `@/lib/page-models/common`, `departments`, `document`, `home`, `info`, `members`, `records`, `shell`, and every `@/lib/page-models/management/*` module.
- Visible host UI: `@/components/platform/OperatingContext`, `../shared/operational/bodies`, and `../../shared/studio/fields`.
- Interactive host bridges: `@/components/functional/records/recordActions`, `@/lib/records/workspace/useRecordsWorkspace`, the folders/people/roles/document-types workspaces, `@/components/people/PersonAccessTrees`, `@/components/documentTypes/TypeInspector`, and `@/lib/documents/typeTree`.
- Navigation shims required by the unchanged Design: `next/link` and `next/navigation`.
- Static API endpoints observed in the production audit: `/api/character-claims`, `/api/departments`, `/api/invitations/join-decision`, `/api/invitations/revoke`, and `/api/role-assignments`.
- NPM presentation dependencies: React, Lucide, Radix UI, `react-arborist`, and the unchanged Next-compatible link/navigation surface.

The allowlisted dependency-light production mirrors are checked by `npm run parity:check-production -- --production <path>`. The remaining entries are deliberately classified as Lab host shims or emulated runtime bridges; they are not copied into the Design folder.

## Lab deviations recorded for Phase 2

- The old `src/designs/obsidian-lab/` fork and its adapters were removed after the production folder was copied unchanged.
- Lab preview dispatch now consumes the generated production registry and production page-model adapters.
- The old contract-probe registry remains only as a test fixture compatibility path; it is not imported by the production-shaped Lab runtime.
- Lab-only compatibility modules exist outside `src/designs/obsidian/` for iframe navigation, backend workspaces, Next hooks, and the visible OperatingContext. They must stay outside the portable folder.
- The Lab surface catalog has been reconciled: production-shaped navigation exposes `members` and `management.person`; the obsolete singular `member` slot is absent. Legacy `member` text remains only in isolated contract-probe compatibility fixtures and persona data.

## Baseline acceptance

At this freeze point, the Obsidian source folder and bundled asset materialization
are byte-identical. Phase 2 execution subsequently completed the host
behavior, route/surface truth, mutation emulation, render environment,
automated parity, cross-host visual evidence, portability probe, and
documentation work. The owner-approved P2-GATE sentence is recorded in the
task conversation; this baseline is retained as the frozen starting point.
