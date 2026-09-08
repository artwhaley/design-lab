# T12 Source Obsidian Visual Baselines

These goldens are the visual oracle for the Obsidian fidelity remediation.

## Provenance

- Source checkout: `../obsidian-incubation`
- Source commit: `fc22e6c7db7da05b6166e2f126c5e6c9e6a20223` (`fc22e6c`)
- Source preview: `http://127.0.0.1:3066`
- Capture command: `npm run capture:obsidian-source`
- Browser: Chrome `151.0.7922.138`, headless through Playwright
- Screenshot mode: viewport-only PNGs; no crop, mask, or Lab-generated source
- Hash/provenance manifest: [`tests/visual/goldens/obsidian-source/fc22e6c/manifest.json`](../../tests/visual/goldens/obsidian-source/fc22e6c/manifest.json)

The capture helper verifies the source Git `HEAD` before opening the browser and
fails if it is not the T00-frozen SHA. Source dependencies were installed from
the source lockfile. The helper does not edit the source checkout.

## Capture matrix

The primary viewport directories are:

- `desktop-1440x1000`
- `mobile-390x844`

The default authenticated fixture includes every required route:

| Surface | Source route |
| --- | --- |
| Home | `/domain/aster-reach` |
| Records | `/domain/aster-reach/records` |
| Document | `/domain/aster-reach/documents/1` |
| Departments | `/domain/aster-reach/departments` |
| Department detail | `/domain/aster-reach/departments/northwatch-council` |
| About | `/domain/aster-reach/about` |
| Lore index | `/domain/aster-reach/lore` |
| Lore detail | `/domain/aster-reach/lore/northwatch` |
| Character profile | `/domain/aster-reach/characters/elara` |
| Folders | `/domain/aster-reach/manage/folders` |
| Document Types | `/domain/aster-reach/document-types` |
| Roles | `/domain/aster-reach/roles` |
| People | `/domain/aster-reach/manage/people` |
| Work | `/domain/aster-reach/work` |

Home and Records also have `-visitor` and `-empty` captures for the supported
source fixture states. There are 36 PNGs total: 28 default-route captures and
8 fixture-state captures. Each file's SHA-256, route, state, viewport, and URL
are recorded in `manifest.json`.

## Deterministic settle procedure

For every navigation the helper:

1. waits for `networkidle`;
2. waits for `document.fonts.ready`;
3. enables reduced motion in the browser context;
4. disables CSS animation/transition timing for the capture;
5. waits a final 250 ms for lazy source components and layout settlement;
6. captures the exact requested viewport.

No transient toast or modal is opened. The Department detail route is still
allowed to mount its lazy chart before capture.

## Fidelity fixture

The generic Lab can be opened with `?fixture=obsidian-fidelity` to use the
deterministic source-equivalent profile. It reuses existing generic semantic
fields for Aster Reach copy, the source record titles/dates/types, departments,
members, folders, and lore. It does not add source-only contract fields,
authorization rules, or organization-chart parent/reporting edges. The missing
department hierarchy remains the explicit T11 pressure/waiver candidate.

T12 goldens are frozen evidence. Later tickets may compare against them but must
not update, regenerate, mask, or replace them without explicit user
authorization.

## T13 regression commands

- Browser behavior: `npm run test:e2e`
- Source visual comparisons: `npm run test:visual`
- Visual budget: maximum `0.02` differing pixels at identical viewport/state.

The browser suite uses the installed Chrome executable through Playwright and
starts/reuses the Lab Vite server on port 4174. It never runs a golden-update
command; the T12 source images remain the comparison oracle.
