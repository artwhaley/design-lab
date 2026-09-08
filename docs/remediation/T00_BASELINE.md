# DLR-T00 Baseline Evidence

Captured 2026-09-08 in the local remediation workspace before product-code edits.

## Repositories and frozen revisions

| Item | Value |
|---|---|
| Design Lab repo | `https://github.com/artwhaley/design-lab` |
| Design Lab start branch | `tool/design-lab-v1` |
| Design Lab start commit | `6021be624f46742beef2bb5ac882428e1f8778b1` |
| Design Lab pre-edit state | clean; branch tracked `origin/tool/design-lab-v1` at the same SHA |
| Remediation branch | `fix/obsidian-fidelity-remediation` |
| Obsidian source repo | `https://github.com/artwhaley/loreforge2` |
| Obsidian source branch | `design/obsidian-incubation` |
| Obsidian source root | `design-incubator/obsidian/` |
| Obsidian source checkout SHA | `fc22e6c7db7da05b6166e2f126c5e6c9e6a20223` |
| Historical SHA in the failed Lab test | `fc22e6c7db7da05b6166e2f126c5e6c9e6a20223` |
| Historical SHA equals frozen source checkout | yes |

The Design Lab remote fetch was attempted and could not acquire the local Git HTTPS credential; the existing remote-tracking ref was already at the recorded start SHA. The source checkout's `origin` is a local `sl-civic-archive` clone and has no `design/obsidian-incubation` remote ref to fetch. The source branch checkout itself is the frozen authority used by the remaining tickets; later tickets must not follow a moving branch tip.

## Dependency delta

The Lab has React, ReactDOM, Lucide, Radix, and React Arborist, but no source font packages, Syncfusion diagrams, Motion, or Playwright. The source Obsidian incubator package uses:

| Package | Source incubator | Lab at T00 | T01/T07 disposition |
|---|---:|---:|---|
| `@fontsource-variable/manrope` | `^5.2.8` | absent | add, source-justified |
| `@fontsource/instrument-serif` | `^5.2.8` | absent | add, source-justified |
| `@syncfusion/ej2-react-diagrams` | `^34.2.7` | absent | add if immutable chart compiles/ is used |
| `motion` | `^12.23.26` | absent | do not add for source preview harness animation |
| `lucide-react` | `^0.577.0` | `^1.42.0` | keep Lab version unless compilation/fidelity proves a required change |
| `radix-ui` | `^1.4.3` | `^1.6.7` | keep Lab version unless proven incompatible |
| `react-arborist` | `^3.16.0` | `^3.16.0` | already aligned |
| `@playwright/test` | absent | absent | add for T07/T13 |

## Source/Lab presentation inventory

The source portable set is under `obsidian-incubation/design-incubator/obsidian/src/`. The current Lab files are failed implementation evidence, not the visual authority. SHA-256 values below were calculated before the snapshot replacement.

| File | Source lines | Lab lines | SHA equal | Material observation |
|---|---:|---:|:---:|---|
| `DocumentActions.tsx` | 24 | 35 | no | rewritten action presentation |
| `Navigation.tsx` | 99 | 64 | no | shortened; active-state handling was removed |
| `ObsidianAbout.tsx` | 48 | 45 | no | rewritten |
| `ObsidianCharacterProfile.tsx` | 67 | 94 | no | expanded/re-authored profile |
| `ObsidianDepartmentDetail.tsx` | 144 | 58 | no | chart source replaced with a simplified Lab view |
| `ObsidianDepartments.tsx` | 61 | 45 | no | rewritten |
| `ObsidianDocument.tsx` | 142 | 101 | no | shortened/restructured |
| `ObsidianDocumentTypes.tsx` | 174 | 270 | no | management UI re-authored |
| `ObsidianFolderManager.tsx` | 178 | 201 | no | management UI re-authored |
| `ObsidianHome.tsx` | 144 | 102 | no | shortened/restructured |
| `ObsidianLore.tsx` | 138 | 90 | no | shortened/restructured |
| `ObsidianManagement.tsx` | 78 | 513 | no | generic management was rebuilt in the Lab |
| `ObsidianRecords.tsx` | 463 | 369 | no | source controls/markup were changed |
| `ObsidianShell.tsx` | 73 | 70 | no | native operating-context selects replaced source treatment |
| `ReadingSurface.tsx` | 40 | 25 | no | shortened/restructured |
| `config.ts` | 44 | 117 | no | Lab config wrapper diverged from source |
| `controls.tsx` | 154 | 139 | no | control implementation changed |
| `obsidian.module.css` | 3712 | 4149 | no | CSS was materially expanded/re-authored |

The source `contracts/**` set has no same-name counterpart in the Lab package and is therefore not copied as production contract infrastructure. The source `preview/main.tsx`, `preview/useMockWorkspace.ts`, and `preview/fixtures.ts` are incubation-only reference files.

## Known failure checks

| Check | T00 result |
|---|---|
| Lab Navigation preserves source active state | no; current Shell contract supplies no route context and current Navigation comments acknowledge the omission |
| Lab Shell preserves source Operating Context visual treatment | no; current Lab Shell uses native domain/character `<select>` controls |
| Lab package loads source fonts | no; neither Manrope Variable nor Instrument Serif is a Lab dependency/import |
| Current `PreviewPane` uses a real iframe | no; it renders Design React DOM into the host document and only changes wrapper width/min-height |
| `compareAndViewport.test.tsx` blesses same-document rendering | yes; its CSS-isolation assertion explicitly says both panes mount in one document and there is no iframe |
| Obsidian tests include source-derived screenshots | no; current tests are slot/semantic smoke tests only |

## Test/build evidence before edits

Commands run from `design-lab/` without editing product code:

| Command | Result |
|---|---|
| `npm test` | failed during Vitest/Vite startup: esbuild reported `Cannot read directory "../../..": Access is denied` and could not resolve `vite.config.ts` |
| `npm run build` | TypeScript phase completed; Vite phase failed with the same esbuild access-denied/config-resolution error |
| existing browser Lab preview | loaded at `http://127.0.0.1:4173/` and rendered the current failed same-document port |
| source browser preview | loaded at `http://127.0.0.1:3066/` from the frozen source checkout |

The browser evidence also confirms that current tests are insufficient: the Lab can render the port while visibly diverging from the source, and a selected 390px-style `Phone wide` preset clips the ported page inside the outer Lab document instead of changing the browser viewport.

## Semantic pressure inventory

- Generic shell route context is missing. The source Navigation needs a host-supplied active segment; the Lab currently supplies only model/runtime/children.
- The source operating-context row requires Design-owned presentation over supplied identity/capability facts. The current Lab exposes the facts but forces native controls.
- The source department chart requires explicit `parentId` / reports-to relationships. The current `DepartmentPageModel.members` contains only `{ id, name }`; membership and department membership are not truthful reporting edges. No hierarchy may be inferred.
- Source records/document/folder/type interactions must bind to Lab workspaces/action bridges. The source preview's mock workspace is not a valid integration seam.
- The source source-reset CSS, source fonts, and Radix portals require an isolated iframe document; the current host wrapper cannot provide that environment.

## Before comparison evidence

Source screenshots copied from the frozen source checkout are retained in `docs/remediation/before/`:

- `source-home-desktop.png` — source `/domain/aster-reach/`, populated fixture, desktop reference.
- `source-records-desktop.png` — source `/domain/aster-reach/records?fixture=visitor`, visitor fixture, desktop reference.
- `source-document-desktop.png` — source `/domain/aster-reach/documents/1`, populated fixture, desktop reference.

The following live source/Lab observations were captured in Chrome on 2026-09-08 and are the diagnostic fourth comparison plus the same-state companions for the retained source images:

| Surface/state | Source reference | Failed Lab reference | Observed divergence |
|---|---|---|---|
| Home / populated / desktop | `before/source-home-desktop.png`; source `http://127.0.0.1:3066/domain/aster-reach/` | Lab `http://127.0.0.1:4173/`, Design `Obsidian Lab`, Home | Lab is mounted in the host and uses the selected fixture text/config, but the outer Lab chrome surrounds it and the route active state/operating context are not source-faithful. |
| Records / visitor / desktop | `before/source-records-desktop.png`; source `http://127.0.0.1:3066/domain/aster-reach/records?fixture=visitor` | Lab `http://127.0.0.1:4173/`, Design `Obsidian Lab`, Records, visitor scenario | Source has a centered dark archive composition with source card/list controls; the Lab wrapper remains the parent document and uses Lab-owned state/control differences. |
| Folder management / populated / desktop | source `http://127.0.0.1:3066/domain/aster-reach/manage/folders` | Lab `http://127.0.0.1:4173/`, Design `Obsidian Lab`, Manage Folders | Both show the Obsidian visual vocabulary, but they are backed by different fixture data and current Lab controls; this is a semantic-pressure/fidelity fixture issue, not evidence to rewrite source. |
| Home / populated / mobile preset | source mobile source screenshot `design-incubator/obsidian/screenshots/home-mobile.png` | Lab `http://127.0.0.1:4173/`, Design `Obsidian Lab`, Home, View → `Phone wide` | Demonstrated false viewport: the page is a 390px wrapper inside the wide Lab document; source mobile media queries and the Lab host remain coupled, and the page is visibly clipped rather than being a real 390px browsing context. |

Formal source goldens are intentionally deferred to T12. These T00 captures and comparisons are diagnostic evidence only.

## T00 conclusion

The failed implementation is cleanly isolated from the remediation branch at `6021be6`. The evidence supports the packet architecture: immutable source snapshot + adapters, generic route context, serializable backend snapshots, and a same-origin iframe preview. No product code was changed in T00.
