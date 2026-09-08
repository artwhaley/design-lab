# Obsidian fidelity review gate

Generated from the immutable source snapshot fc22e6c on 2026-09-08. The source PNGs are the T12 goldens; paired images show source on the left and Lab on the right. The numeric comparison uses pixelmatch with the unchanged acceptance threshold of <=2% differing pixels.

## Remediation record

- Environment: the visual harness now floor-aligns the iframe bounding box before cropping. The prior fractional ceiling crop shifted every mobile glyph by one pixel; the corrected crop compares the iframe content at the requested dimensions without hiding any content.
- Adapter mapping: RecordsAdapter reports ws.results.total so the source Records count remains 72 even while the workspace initially materializes its first page.
- Fidelity fixture: the source-equivalent Stewardship record uses the source Charter document type.
- No source files, source CSS, or T12 golden images were edited.

## Required command evidence

| Command | Result |
|---|---|
| npm run verify:obsidian-source | green: 27 protected files at fc22e6c... |
| npm test | 17 files, 188 tests passed; pre-existing React act/markup warnings only |
| npm run test:e2e | 8 browser tests passed |
| npm run test:visual | 3 frozen-source comparisons passed at <=2% |
| npm run build | green; Vite chunk-size warning only |

Diagnostic T00 before captures remain in [docs/remediation/before](../before). The complete paired-image report is [review/index.html](review/index.html).

## Primary comparison matrix

| Surface | Viewport | Diff | Result | Waiver |
|---|---|---:|---|---|
| Home | desktop-1440x1000 | 0.054% | pass | — |
| Records | desktop-1440x1000 | 0.000% | pass | — |
| Document | desktop-1440x1000 | 0.000% | pass | — |
| Departments | desktop-1440x1000 | 0.000% | pass | — |
| Department detail | desktop-1440x1000 | 5.104% | pressure-waiver | Source organization-chart reporting edges are unavailable in the generic Lab contract; the adapter renders a truthful member directory in this region. |
| About | desktop-1440x1000 | 0.000% | pass | — |
| Lore | desktop-1440x1000 | 2.243% | pressure-waiver | Selector .loreIntroduction: the generic LorePageModel has no introduction field, so the adapter cannot truthfully supply this source-only paragraph. |
| Lore detail | desktop-1440x1000 | 4.062% | pressure-waiver | The generic Lab route context does not expose a lore slug; the Lab shows the truthful Lore index rather than inventing article selection. |
| Character profile | desktop-1440x1000 | 2.252% | pressure-waiver | Selectors .characterProfileFacts and .characterProfileCopy: the generic member model supplies plural departments/roles and recorded work, not the source focus/detail claim. |
| Folders management | desktop-1440x1000 | 0.473% | pass | — |
| Document types | desktop-1440x1000 | 0.568% | pass | — |
| Roles management | desktop-1440x1000 | 0.605% | pass | — |
| People management | desktop-1440x1000 | 1.897% | pass | Selector section[aria-label="People search"]: the controlled Lab PeopleWorkspace supplies search results rather than the source management-table rows. |
| Work management | desktop-1440x1000 | 2.103% | pressure-waiver | Selector section[aria-label="Work queue"]: the Lab WorkWorkspace exposes authorized submitted WorkEntry records, not the source mixed draft/review queue. |
| Home | mobile-390x844 | 0.000% | pass | — |
| Records | mobile-390x844 | 0.000% | pass | — |
| Document | mobile-390x844 | 0.002% | pass | — |
| Departments | mobile-390x844 | 0.000% | pass | — |
| Department detail | mobile-390x844 | 13.729% | pressure-waiver | Source organization-chart reporting edges are unavailable in the generic Lab contract; the adapter renders a truthful member directory in this region. |
| About | mobile-390x844 | 0.000% | pass | — |
| Lore | mobile-390x844 | 0.279% | pass | Selector .loreIntroduction: the generic LorePageModel has no introduction field, so the adapter cannot truthfully supply this source-only paragraph. |
| Lore detail | mobile-390x844 | 3.147% | pressure-waiver | The generic Lab route context does not expose a lore slug; the Lab shows the truthful Lore index rather than inventing article selection. |
| Character profile | mobile-390x844 | 2.477% | pressure-waiver | Selectors .characterProfileFacts and .characterProfileCopy: the generic member model supplies plural departments/roles and recorded work, not the source focus/detail claim. |
| Folders management | mobile-390x844 | 1.358% | pass | — |
| Document types | mobile-390x844 | 1.074% | pass | — |
| Roles management | mobile-390x844 | 1.891% | pass | — |
| People management | mobile-390x844 | 7.004% | pressure-waiver | Selector section[aria-label="People search"]: the controlled Lab PeopleWorkspace supplies search results rather than the source management-table rows. |
| Work management | mobile-390x844 | 7.954% | pressure-waiver | Selector section[aria-label="Work queue"]: the Lab WorkWorkspace exposes authorized submitted WorkEntry records, not the source mixed draft/review queue. |

## Narrow pressure waivers

The following are not blanket visual masks. Each is a specific source-vs-generic-contract semantic gap, limited to the listed DOM region: organization-chart reporting edges (.orgChartPanel), Lore introduction (.loreIntroduction), member profile body facts/copy (.characterProfileFacts and .characterProfileCopy), controlled People search (section[aria-label=\"People search\"]), Work queue (section[aria-label=\"Work queue\"]), and Lore detail route selection (the Lore surface has no generic lore slug). Navigation, shell, typography, viewport geometry, and the three exact visual regression cases remain unwaived and green.

This is the T14 human review gate. Execution stops here pending explicit user approval for the next ticket.
