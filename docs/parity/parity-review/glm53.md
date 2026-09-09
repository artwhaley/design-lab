# Hostile Readiness Audit — LoreForge Compile-Time Design Architecture

**Audit scope:** "Drop the Design folder into production and recompile" readiness
**Oracle (production):** `sl-civic-archive` @ `patch/design-contract-management-and-obsidian`, HEAD `10030c5`
**Design Lab:** `design-lab` @ `fix/obsidian-fidelity-remediation`, HEAD `944bcab`
**Local checkouts:** `C:\Users\artwh\Downloads\loreforge2\sl-civic-archive`, `C:\Users\artwh\Downloads\loreforge2\design-lab`
**Lens document:** `LoreForge_DESIGN_BIBLE.md` (2,523 lines, read in full)
**Audit window:** 2026-09-08, ~12:50–13:56 local (all re-runs executed against the committed HEADs above)

---

## ⚠️ Session anomaly disclosure (read first)

At **~14:26 local, while this audit was concluding, a concurrent remediation process began modifying BOTH worktrees** (uncommitted). Timestamps: Lab `src/lib/design/types.ts` 14:26, `AGENTS.md` 14:34, new Design folder `atelier` 14:35 (Lab) / 15:03 (production). The concurrent edit is deleting the Lab-only `LabDesignDefinition`/`runtime`/`member`-slot contract layer (the drift my audit flagged in F1) and adding an `atelier` probe Design to both hosts — i.e., someone is actively fixing the highest-severity findings as they were identified. All PASS/FAIL verdicts below are against the **committed HEADs**, which were verified byte-identical between hosts during the window. The final section notes the concurrent state separately. Also observed mid-audit: a transient `src/designs/portability-probe` folder in production — explained as a concurrently-running drop-in proof (its `finally` block removes it); production tree was verifiably clean after my own proof run.

---

## Executive verdict

| # | Gate | Verdict |
|---|------|---------|
| 1 | Compile-time Design portability | **PASS** |
| 2 | Exact Obsidian source parity | **PASS** |
| 3 | Contract parity (portable surface) | **PASS** — with a Lab-repo internal-drift **FAIL (F1)** that did NOT touch the portable folder |
| 4 | Navigation & shell parity | **PASS** |
| 5 | Render & runtime parity | **PASS** (re-ran 48/48 live at current HEADs) |
| 6 | Design Bible alignment | **FAIL** (documentation gaps F4–F9) |
| 7 | Regression suite | **PASS** (17 suites green) — one script-ergonomics finding (F2) |
| 8 | Five-design readiness | **PASS** (reasoned; see analysis) |

### Final verdict (explicit)

**READY — for authoring new Design folders** — conditional on the documentation fixes in Gate 6 and the Lab-internal cleanup already in flight (F1). The architecture itself — discovery, manifest contract, asset materialization, registry generation, boundary audit, cross-host parity machinery — is sound, proven by executable evidence, and does not require hand-edits to unions/registries/catalogs. The NOT-READY signals are documentation authority conflicts and one Lab-only internal contract layer that a design agent could mistakenly author against; both are being remediated concurrently and neither invalidates the portable-folder architecture.

---

## Gate 1 — Compile-time Design portability: PASS

**Evidence trail (all executed 13:0x–13:5x against clean HEADs):**

| Check | Command (run in `sl-civic-archive`) | Result |
|---|---|---|
| Discovery check (generated files current) | `npm run design:discover -- --check` | `checked 4 Designs: civic, ledger, poster, obsidian` |
| Discovery determinism unit test | `npm run test:design-discovery` | 1 pass |
| Package boundary audit (check mode) | `npm run design:audit:check` | `audited 4 Design packages; no boundary errors` |
| **Drop-in proof (no build)** | `npm run test:design-dropin` | `discovered 5 Designs: civic, ledger, poster, obsidian, portability-probe` → `discovered 4` → **passed**, exit 0 |
| **Drop-in proof (full production build)** | `npm run test:design-dropin:build` | (committed CI script; not re-run — the no-build variant plus `tsc --noEmit` inside it typechecks the installed probe) |
| Post-proof cleanliness | `git status --porcelain` + `Test-Path src/designs/portability-probe` + `rg portability-probe src/lib/design/generated` | clean / absent / zero hits |

**Architecture findings (positive):**

- `scripts/discover-designs.mjs` (production) validates manifests fully: `manifestVersion === 1`, `designContractVersion === 1`, lowercase kebab key matching folder, bounded `sortOrder` 0–100000, `entry === './index.ts'` exactly, thumbnail constrained to `assets/`, symlink-escape and traversal rejection, duplicate key and duplicate sortOrder rejection (lines 10–183). No hand-editable union exists — `DesignKey` is derived (`generated/designKeys.ts:10`).
- Generated `registry.ts` self-checks every manifest field against the definition at import time (`generated/registry.ts:35-40`), so a stale catalog throws at module load, not at user click.
- Asset materialization deletes unknown keys under `public/design-assets/` and re-copies deterministically (`discover-designs.mjs:150-168`); `public/design-assets/` is gitignored (generated output only).
- The drop-in proof (`scripts/test-design-dropin.mjs`) copies the `test-fixtures/designs/portability-probe` fixture into `src/designs/`, runs discovery, asserts the probe appears in **all three** generated files and the materialized asset, runs `tsc --noEmit` with the probe installed, then in `finally` removes the folder, re-runs discovery, and asserts the probe string is absent everywhere (`test-design-dropin.mjs:24-61`). Probe install → generated artifacts → full cleanup is proven; even a failure path cleans.
- Adding a Design requires **zero** edits to unrelated Designs: discovery is folder-scan-driven; `NON_DESIGN_FOLDERS` is only `shared` (host support).

**Gate-1 residual risk:** none material. The `DEP0190` deprecation warning in `test-design-dropin.mjs` (spawn with `shell:true` on Windows, `test-design-dropin.mjs:19`) is cosmetic.

---

## Gate 2 — Exact Obsidian source parity: PASS

**Reproduction (any PowerShell, run before the concurrent edits or at committed HEADs):**

```powershell
$prod="…\loreforge2\sl-civic-archive\src\designs\obsidian"; $lab="…\loreforge2\design-lab\src\designs\obsidian"
# file-set + SHA-256 comparison (executed in audit; also re-verified at 15:05 worktree state)
```

- **File sets:** prod 36 files, Lab 36 files; only-prod: none; only-Lab: none.
- **SHA-256:** all 36 byte-identical (includes `design.manifest.json`, `index.ts`, `config.ts`, `obsidian.module.css`, all page/operational TSX, `assets/thumbnail.svg`, `assets/atmosphere.png`, 2 `.woff2` fonts + 2 OFL licenses, `studio/ObsidianStudioEditor.tsx`, `config.design.test.ts`).
- **Committed parity tool agrees:** `node scripts/verify-design-folder-parity.mjs --production ..\sl-civic-archive` (in Lab) → `[design parity] Obsidian source parity: PASS (36 files)`; also compares materialized `public/design-assets/obsidian` bytes against the source assets.
- **No `obsidian-lab` remnants:** `rg -n "obsidian-lab" design-lab src/` → only historical docs (`docs/remediation/*`, `execution-notes/P2-T03.md`, `docs/parity/P2-T00-BASELINE.md`, `scripts/test-parity.mjs` usage string) — zero hits in any source, asset, or manifest.
- **No Lab-only source contract inside the portable folder:** the obsidian folder imports **exactly** the same specifier set in both hosts (verified by extracting all import paths: 52 distinct specifiers, identical in prod and Lab), all production-shaped (`@/lib/…`, `@/components/…`, `react`, `next/navigation`, `lucide-react`, `react-arborist`, `vitest`, plus `../../shared` host-support and intra-folder relatives). Notably `index.ts` uses `DesignDefinition` from `@/lib/design/types` — and `src/lib/design/types.ts` is byte-identical between hosts.
- **Import-graph cross-check:** production `audit-design-packages.mjs` enforces no cross-Design imports, no folder-escape imports, sanctioned asset namespaces only (`/media/…`, `/design-assets/<own-key>/…`); check-mode passed.

---

## Gate 3 — Contract parity: PASS (portable contract) with F1 drift in Lab internals

**The portable `DesignDefinition` contract is identical.** `src/lib/design/types.ts` and `src/lib/design/contracts.ts` are byte-identical between production and Lab (`fc /b` → no differences), and the Lab `parity:check-production` allowlist (26 files) covers every type the Design folder imports: all 16 page-model modules, records workspace (`useRecordsWorkspace.ts`, `types.ts`, `supersession.ts`), `recordActions.tsx`, `validate.ts`, `assets.ts`, `fixtures.ts`, shared studio `fields.tsx`, `lifecycle.ts`. `npm run test:parity -- --production ..\sl-civic-archive` → **PASS**.

**Class A surface set matches the Bible exactly** (16 slots, no `member`): `types.ts:116-143` requires `home, records, document, departments, department, about, lore, members, work` + `management.{departments,folders,roles,documentTypes,people,person,invitations}`. Obsidian `index.ts` supplies all 16, no more. `Work` is a required, top-level slot (separate from `management`) per Bible §7/§27.

**Auth/capability boundary is correct:** production `buildDomainShellModel.ts` computes every management item from real authorization (`canMembers`, `canRoles`, … lines 39-55); the Design receives filtered lists only. Obsidian renders `model.managementNavigation` verbatim and never invents items.

**F1 (HIGH — Lab-internal, being remediated concurrently):** at committed HEAD `944bcab`, the Lab repo still contained a parallel authoring contract at `src/contracts/design.ts:184-225` — `LabDesignDefinition` with `LabShellProps`/`DesignRuntime` props and an **invented `member` slot** (`design.ts:193` `member: ComponentType<LabPageProps<MemberPageModel…>>`), plus `MemberPageModel` in `src/contracts/pageModels.ts:340`, a runtime-registry (`src/designs/registry.ts` + `src/designs/index.ts` where "New Designs add one import here"), and `LabShellProps`/`LabStudioEditorProps` consumed by `_template/` and `contract-probe/`. The real obsidian folder did **not** use any of it (its imports are all production-shaped), so this is not portable-contract drift — but a design agent scaffolding from `_template/` or reading `src/contracts/` could author against the Lab-only API the Bible explicitly forbids (§2.1 "it does not replace them with a second author-facing Design API"; §7 "a Lab-only `member` slot [is] not portable Design API requirements"). The concurrent process (post 14:26) is deleting exactly this layer (`M src/contracts/design.ts` diff retitles it "host-internal utilities… Nothing here is required by a Design folder", `D src/designs/registry.ts`, `D src/designs/_template/*`, `D src/host/designRuntime.ts`, `D src/host/PreviewPane.tsx`) and converting `contract-probe` to a manifest-based Design. **Verify that remediation lands and passes `npm test` + `npm run test:e2e` before authoring; at committed HEAD this was the single largest readiness risk.**

**F3 (MEDIUM): Lab mirrors of shared workspaces are behavioral stubs, not copies.** `useFolderManagementWorkspace.ts` (Lab 34 lines vs prod ~150), `useRoleManagementWorkspace.ts`, `usePeopleManagementWorkspace.ts`, `useDocumentTypesManagementWorkspace.ts`, `hostActionBridges.ts` (Lab dispatches through a `globalThis.__loreforgeLabProductionAction` hook instead of re-exporting server actions), `bodies.tsx` (Lab PersonBody 24-line mirror), `work/projection.ts`, `lifecycleStages.ts`, `typeTree.ts`, `theme/color.ts`, `theme/fonts.ts` are Lab-side emulations with production-shaped signatures. This is **by design** (Bible §52 sanctions host shims; CONTRACT_BASELINE.md "Host contract inventory") and the parity allowlist correctly does **not** include them. Risk: a future Design that consumes a production workspace behavior absent from the stub (e.g., folder search/sort in prod's `useFolderManagementWorkspace`) will pass in the Lab and behave differently in production. The mitigations that exist today — byte-parity allowlist on true contract types + 48-case cross-host pixel/DOM/input parity, which exercises the workspace-consuming surfaces — caught everything for Obsidian, but the stub-vs-real gap is a standing class of risk for new Designs. (PersonAccessTrees.tsx differs only by `.scss`→`.css` import; CSS bytes identical.)

**No copied business logic drift:** `rg` for direct `/api/` calls inside obsidian folder — only through the sanctioned bridges; `audit-design-packages.mjs` `staticApiEndpoints` reporting covers this and check passed with no errors.

---

## Gate 4 — Navigation & shell parity: PASS

**Production semantics (oracle):** `buildDomainShellModel.ts:57-63` emits primary nav exactly `Home, About, Lore, Departments, Records`; `Work` only via `model.routes.workUrl` (`:88`); `Members` appears **only** in `managementNavigation` and only for `role === 'admin'` (`:49`) — never public. Fixture parity for the Lab is exact: `design-lab/src/fixtures/buildScenario.ts:359-379` reproduces both lists verbatim (incl. the admin-only `Members` item under management).

**Obsidian Shell renders them correctly (both hosts, byte-identical files):**
- Desktop top nav: `Navigation.tsx:18-21` appends `Work` (from `routes.workUrl`) **exactly once** to the 5 primary items; `aria-current="page"` active state per segment; management items excluded from primary nav.
- Work appears once, never in `management.*` — matches Bible §13.
- Bottom/footer: `ObsidianShell.tsx:36-51` renders "Manage domain" `ActionMenu` only `if (model.managementNavigation.length > 0)` — no invention when absent; plus the `LoreForge dashboard` escape link (`:52-54`).
- Management nav: footer menu (desktop) + mobile drawer "Manage domain" section (`Navigation.tsx:82-97`) + an SR-only `<nav aria-label="Management navigation">` landmark (`:51-57`) — one reachable presentation per supplied item, none invented. Matches Bible §13's documented Obsidian placement.
- Mobile: Radix Dialog drawer with all primary+Work items and the management section (`Navigation.tsx:58-106`); Playwright e2e confirms the portal stays inside the preview iframe document (`tests/e2e/obsidianBrowser.spec.ts` "Radix mobile navigation portal stays inside the iframe document" — passed).
- Active-state logic: `activeSegmentForPath` (`Navigation.tsx:111-120`) maps `/manage/*` to no primary active state — management surfaces don't light up a primary tab. e2e "active navigation and internal route requests stay in the preview iframe" passed.
- `OperatingContext` rendered exactly once per Shell (`ObsidianShell.tsx:22`, `<OperatingContext model tone="obsidian" />`); Lab component is behavior-identical to production (byte-diff limited to the style import extension; CSS identical). Refresh/white-screen: the prior P08-era failure class is covered by the committed e2e suite (config-bank persistence across navigation and reload: "saved Obsidian config stays in its Design bank across Lab navigation" — passed) and by the cross-host harness, which reloads the Lab host between every case (`cross-host-parity.mjs` per-case `labPage.reload`) — 48/48 with zero white-screens.

---

## Gate 5 — Render & runtime parity: PASS (re-verified live, not trusted from docs)

**Recorded evidence (committed at `944bcab`):** `docs/parity/parity-review/manifest.json` — 16 surfaces × 3 viewports (desktop 1440×1000, compact 1024×900, mobile 390×844) = **48 comparisons, 0 failures, maxChangedPixelRatio 0, domMismatches 0, inputMismatches 0, assetMismatches 0**. PNGs are genuine raw captures (production vs Lab bytes differ; e.g. `desktop-1440x1000-home-production.png` 1,236,802 B vs lab 1,236,806 B, diverging at byte 0x45) — **not text-masked screenshots**.

**Hostile re-run (this audit, live, current HEADs):** production `next start` :3055 + Lab `vite preview` :4174, then `node scripts/cross-host-parity.mjs` in the Lab. First a 7-case representative subset (home desktop, records mobile, folders compact, work/members/invitations desktop, person mobile) — all `pixels=0.000% dom=PASS assets=PASS`. Then the **full matrix**: all 48 cases re-executed against prod HEAD `10030c5` / Lab HEAD `944bcab` → **`Cross-host parity complete: 48 deterministic route/viewport pairs; failures: 0; max changed pixels: 0.000%`**. Regenerated DOM/input artifacts were content-identical to the committed packet (only CRLF noise + 4 Lab PNGs raster-noise-differ; all pass criteria identical). The committed evidence packet was restored byte-clean afterwards (`git status` = 0 lines).

**F2 (MEDIUM — tooling/UX):** `npm run parity:check-production`, `npm run parity:folder`, and `npm run test:parity` **fail out of the box** — the scripts require `--production <path>` (`sync-production-contract.mjs:37`, `verify-design-folder-parity.mjs:14`, `test-parity.mjs` usage) but the npm aliases pass no default. Correct invocations: `npm run test:parity -- --production ..\sl-civic-archive` (PASS) and `npm run parity:folder -- --production ..\sl-civic-archive` (PASS). ADDING_A_DESIGN.md documents the `--production` form for `test:parity`/`parity:folder` but CONTRACT_BASELINE.md:12-15 shows `npm run parity:check-production -- --production <path>`. Also, the cross-host harness hard-deletes and rewrites `docs/parity/cross-host` + `parity-review` wholesale (`cross-host-parity.mjs:201-204`): a `PARITY_SURFACE`/`PARITY_VIEWPORT` subset re-run **destroys the full 48-case committed packet** and replaces it with the subset's results (observed during this audit; restored via `git checkout`). Treat those docs dirs as generated output only ever regenerated full-matrix, or subset runs must write elsewhere.

**Runtime-substitution check:** parity `settle()` disables animations/transitions/carets; DOM normalization is limited to generated runtime noise (React ids, Radix tabindex, server-action scaffolding, arborist markers) — authored classes, text, links, styles, and the CSS-module class names ARE compared (the Lab's Vite config generates production-shaped `module__scope__class` namespaces — visible in the DOM captures). Font gate asserts Manrope Variable + Instrument Serif actually load; asset gate SHA-256s every referenced `/design-assets/obsidian/*` file on both hosts. Inputs (semantic model + config + theme + pathname) are compared as JSON. A future Design failing after install would have to differ only in unmeasured runtime behavior — for the surfaces in the 16-slot catalog, the harness leaves no such gap; `shared.*` Class B surfaces are covered by the Lab e2e/SharedFunctionalSurface, not pixel-compared (documented).

---

## Gate 6 — Design Bible alignment: FAIL (findings F4–F9)

**F4 (HIGH — authority conflict):** `AGENTS.md` (production, agent-injected rule) still mandates: "Any task that creates or materially changes a site Design must read and follow `DESIGN_AUTHORING.md` before editing `src/designs/**`." The Design Bible §2 declares itself the current contract, "ultimately … replacing or superseding the older `DESIGN_AUTHORING.md`," and `README.md:149` also points agents to `DESIGN_AUTHORING.md`. An agent following AGENTS.md will read the older doc first, whose instructions (e.g. §"Do not add your key to global header/document/theme maps" at `DESIGN_AUTHORING.md:1138`) describe the pre-manifest registry world and contradict Bible §49 ("A normal new Design does not require edits to a key union, central registry, catalog…"). **Fix: update AGENTS.md + README to name `LoreForge_DESIGN_BIBLE.md` as the mandatory read.**

**F5 (HIGH — naming/location ambiguity):** Bible header says "Intended repository location: repository root as `DESIGN_BIBLE.md`" but the actual file is `LoreForge_DESIGN_BIBLE.md`; Lab docs (`docs/ADDING_A_DESIGN.md`) and packets reference it by long name. Pick one canonical name; stale-path risk for agents grepping for `DESIGN_BIBLE.md`.

**F6 (MEDIUM):** Bible §2.1/§48 says parity evidence is "retained under `design-lab/docs/parity/parity-review/`" — correct — but `README.md:153-156` lists required pre-ship checks (`npm test`, `test:security`, `test:design`, `tsc`, `lint`, `build`) without the newer `test:design-dropin`/`design:audit:check` in the "full checks" line (they're listed separately at :153). Minor, but the "Full checks" list is the one agents will copy.

**F7 (MEDIUM):** `CONTRACT_BASELINE.md` and `ADDING_A_DESIGN.md` document `npm run test:cross-host` as if runnable bare (completion checklist item 77, "records current production-vs-Lab evidence"), but it needs both servers up at 3055/4174 (defaults, overridable) — no doc states the prerequisites (start `next start` in production and `vite preview --port 4174` in Lab) or that the Chrome path comes from `OBSIDIAN_CAPTURE_BROWSER` with a hard Windows default. Undocumented required steps, per audit brief.

**F8 (LOW):** Bible §6's example tree still shows `public/<Design>Member.tsx` and `operational/<Design>Person.tsx` (singular Member/Person page files) while §7/§15/§26 say no `pages.member` slot exists; Obsidian implements this correctly (no member-detail page component wired into the definition — `ObsidianPublicCharacterProfile.tsx` exists but is not a definition slot). The folder-layout example should drop the singular `Member.tsx` line to avoid re-teaching the removed concept. Same for §44's server/client table listing "`Member` server where practical".

**F9 (LOW):** `LoreForge_DESIGN_BIBLE.md` §2.1 cites the parity evidence as "48 production-oracle/Lab comparisons" captured against heads `a49cabe`/`b69f705` — one commit behind the shipped HEADs. This audit re-ran the full matrix at current HEADs with identical results, so the claim holds; but the Bible/packet text pins no commit/heads for the evidence, so future drift is undetectable without re-running. (The regenerated `manifest.json` now records `10030c5`/`944bcab` — after the concurrent edits land, regenerate once more.)

**Positive alignment (no contradiction found):** management-in-navigation placement, Work routing, designConfig/theme prop shape, `DesignVariantProps` legacy-transition framing, per-Design config banks, thumbnail/`/design-assets/<key>/` namespace, forbidden imports list, records/folders/roles/people shared-workspace rules, `review`→work and `subdomains`→departments compat classification — all match the implementation as verified in Gates 1–5. `test-fixtures/…/portability-probe` and the probe-manifest flow match Bible §49/§51E's workflow exactly.

---

## Gate 7 — Regression results (all commands + outcomes)

**Production (`sl-civic-archive`, workdir):**

| Command | Result |
|---|---|
| `npm run design:discover -- --check` | PASS — 4 designs |
| `npm run test:design-discovery` | PASS — 1/1 |
| `npm run design:audit:check` | PASS — no boundary errors |
| `npm run test:design-dropin` | PASS — install→typecheck→cleanup proven |
| `npm run test:design` (vitest) | PASS — 25 files / 194 tests |
| `npx tsc --noEmit` | PASS — no output |
| `npm run build` (incl. prebuild discovery) | PASS — full Next route table built |
| `git status` after all runs | clean |

**Design Lab (`design-lab`, workdir):**

| Command | Result |
|---|---|
| `npm run design:check` | PASS — 1 design (obsidian) |
| `npm test` (vitest) | PASS — 15 files / 153 tests (one benign act() stderr warning from conformance smoke) |
| `npm run build` | PASS — (chunk-size warning: `productionRuntime-*.js` 640 kB > 500 kB limit; Lab-only preview bundle, not a production artifact) |
| `npm run test:parity -- --production ..\sl-civic-archive` | PASS — 26 allowlisted contract files + registry + folder + assets + seams |
| `npm run parity:folder -- --production ..\sl-civic-archive` | PASS — 36-file parity (also ran `--check-assets` variant per docs) |
| `npm run verify:obsidian-source` | PASS |
| `npm run test:e2e` (Playwright, 9 tests) | PASS — 9/9 incl. iframe portals, fonts, config banks |
| `node scripts/cross-host-parity.mjs` (subset ×7 then full 48) | PASS — 48/48, 0.000% pixels, DOM/assets/inputs equal |
| `git status` after all runs + packet restore | clean |

**Warnings counted as findings:** the vitest jsdom "create once per worker" perf note and act() warning (cosmetic); Vite 500 kB chunk warning (Lab-only bundle — cosmetic, but if `productionRuntime` ever ships in production mode, revisit); spawn `shell:true` DEP0190 (cosmetic). None affect rendering, assets, generated files, or route behavior in production.

---

## Gate 8 — Five-design readiness (reasoned analysis)

Adding e.g. `atelier`, `vesper`, `tide`, `aurora`, `runic` after this review:

1. **Isolation:** each folder is discovered independently from its own `design.manifest.json`; `new-design.mjs` scaffolds a manifest + 16-slot definition + assets and refuses key collisions/overwrites; no cross-Design import is possible (audit enforces, check passed). ✔
2. **CSS/asset namespacing:** CSS Modules are file-scoped by construction; bundled assets live under `/design-assets/<key>/…` and the audit rejects references into another design's namespace (`audit-design-packages.mjs:107-109`). Obsidian's own tokens are `--obsidian-*` namespaced (Bible §12 pattern confirmed in DOM captures). ✔
3. **No shared-registry edits:** `DESIGN_KEYS`, catalog, registry are generated; adding a folder + running `npm run design:discover` (or any build, via `predev`/`prebuild` hooks) regenerates. `test:design-dropin` proves a brand-new key compiles and integrates with **zero** hand edits. ✔
4. **Determinism:** discovery sorts folders by `(sortOrder, key)` and fails on duplicate sortOrders; generated files are byte-stable (my regenerated 48-case packet's DOM/inputs were content-identical to committed); asset materialization is copy-bytes with stale-key cleanup. ✔
5. **Asset portability:** manifest thumbnails/`assets/` are relative, forward-slash, traversal-checked; both hosts serve them from the same `/design-assets/<key>/` namespace. ✔
6. **Host stability / one Design cannot alter another:** navigation, management, and capabilities are model-driven per request in production (`buildDomainShellModel`) — a Design receives already-filtered items and renders verbatim (Obsidian proven: admin-only Members never leaks into public nav, `managementNavigation.length === 0` renders nothing). Lab host shims are outside all design folders; switching/banks are per-key (e2e-verified persistence). ✔
7. **Lab→production compile path:** proven end-to-end for Obsidian (byte-identical folder + drop-in proof + 48/48 parity) and encoded in `new-design.mjs` + `ADDING_A_DESIGN.md` §6. ✔
8. **Residual risks for five-design scale:** (a) the F1 Lab-internal contract layer — until its deletion lands, four more authors scaffolding from `_template/` would multiply the drift; (b) workspace-stub gaps (F3) — the more Designs consume richer production workspace behavior (folder search/sort, role trees), the more the Lab must extend its emulators in lockstep; (c) `sortOrder` crowding (bounded 0–100000, duplicates rejected) and (d) `public/design-assets` growth is gitignored — fine, but a CI cache stampede risk if anyone hand-authors there (audit's `--check` catches it). All manageable; none architectural.

---

## Findings register (highest risk first)

| ID | Sev | Repo / File : Line | Finding | Repro |
|----|-----|--------------------|---------|------|
| F1 | HIGH | design-lab `src/contracts/design.ts:184-225` (+ `src/contracts/pageModels.ts:340`, `src/designs/registry.ts`, `src/designs/_template/*`, `src/host/designRuntime.ts`, `src/designs/index.ts:7`) | Parallel Lab-only authoring contract (`LabDesignDefinition`, invented `member` slot, `LabShellProps`/`runtime` props) violates Bible §2.1/§7 at committed HEAD `944bcab`. Not used by the portable obsidian folder, but authorable-against. **Concurrent remediation deleting it observed 14:26+; verify it lands.** | `git show 944bcab:src/contracts/design.ts` (see `member:` slot at :193) |
| F4 | HIGH | sl-civic-archive `AGENTS.md` + `README.md:149` vs `LoreForge_DESIGN_BIBLE.md` §2 | AGENTS.md/README still route design agents to superseded `DESIGN_AUTHORING.md` as the mandatory read; Bible claims authority. Two agents following different docs will produce different Designs. | `rg DESIGN_AUTHORING AGENTS.md README.md` |
| F5 | HIGH | sl-civic-archive root | Bible's self-declared canonical filename (`DESIGN_BIBLE.md`) ≠ actual (`LoreForge_DESIGN_BIBLE.md`); every cross-reference must guess. | `Test-Path DESIGN_BIBLE.md` → False |
| F2 | MED | design-lab `package.json` scripts `parity:check-production` / `parity:folder` / `test:parity` | All three fail without `--production <path>` (undocumented default origin `../sl-civic-archive` exists only as an env fallback in cross-host, not here). | `npm run parity:check-production` → Usage error exit 1 |
| F3 | MED | design-lab `src/components/functional/folders/useFolderManagementWorkspace.ts` (34 lines) vs production (~150 lines); same class for roles/people/documentTypes hooks, `hostActionBridges.ts`, `bodies.tsx`, `work/projection.ts`, `typeTree.ts`, `lifecycleStages.ts`, `theme/{color,fonts}.ts` | Sanctioned behavioral stubs with production-shaped signatures — by-design, but a future Design consuming stub-absent behavior passes Lab and diverges in production. Not in the byte-parity allowlist (correctly), so only cross-host parity catches it. | `fc /b` prod-vs-lab per file; diffs are wholesale rewrites |
| F6/F7 | MED | `README.md:156`, `docs/CONTRACT_BASELINE.md`, `docs/ADDING_A_DESIGN.md:77` | "Full checks" list omits drop-in/audit checks; cross-host prerequisites (two servers, Chrome path) undocumented; parity doc paths assume sibling layout. | read files |
| F8 | LOW | `LoreForge_DESIGN_BIBLE.md` §6 (tree) + §44 | Bible's own example tree/table still shows singular `Member.tsx` page and "`Member` server where practical" while §26 forbids the slot — re-teaches a removed concept. | read §6/§26/§44 |
| F9 | LOW | `docs/parity/parity-review/manifest.json` | Evidence heads pinned one commit behind shipped HEADs at doc-writing time (re-verified current in this audit). Packet has no heads-freshness check. | compare `production.head` vs `git rev-parse HEAD` |
| F10 | LOW | design-lab `scripts/cross-host-parity.mjs:201-204` | Subset re-runs (`PARITY_SURFACE`/`PARITY_VIEWPORT`) **destroy the committed full evidence packet** (rm -rf then rewrite subset). Bit me during this audit; restored. | subset run → `git status docs/parity` |
| — | LOW | sl-civic-archive `scripts/test-design-dropin.mjs:19` | Windows `shell:true` spawn DEP0190 deprecation; cosmetic. | run proof |

---

## Minimal remediation recommendations (ordered)

1. **Land and verify the in-flight F1 remediation** (delete Lab-only contract/registry/template layer; manifest-based `contract-probe`): re-run `npm test`, `npm run test:e2e`, `npm run test:parity`, and a full 48-case `test:cross-host` after it merges.
2. **Single-source the Bible**: rename to one canonical filename; update `AGENTS.md` and `README.md` so the mandatory-read instruction points at the Bible; delete or archive `DESIGN_AUTHORING.md` (or prefix it "superseded").
3. **Fix npm script ergonomics**: give `parity:*`/`test:parity` a documented default `--production ../sl-civic-archive` (env-var override), and make subset parity runs write to a scratch dir so they can't clobber the committed 48-case packet.
4. **Docs sweep (F6–F8)**: README "full checks" line gains `test:design-dropin` + `design:audit:check`; cross-host prerequisites section (servers, `OBSIDIAN_CAPTURE_BROWSER`, env origins); Bible §6/§44 drop the singular-Member examples.
5. **After the concurrent edits land, regenerate the parity packet once at the final merged heads** so `manifest.json` pins current SHAs, and re-run `npm run test:design-dropin` in production.

## Remaining contract ambiguity (small list)

- Whether `DESIGN_AUTHORING.md` remains normative for anything (AGENTS.md says yes, Bible §2 says superseded) — needs an owner decision.
- `DesignVariantProps` (`headerLayout`/`documentStyle`): Bible calls it a "narrow legacy transition projection"; production still requires it in page prop types. A new Design must pass empty strings (the Lab does: `headerLayout="" documentStyle=""`). The retirement criteria/version are undefined — fine for now, but it's the one prop every future Design inherits without needing it.
- The singular member/character-profile route (`domain/[slug]/characters/[id]`, plus Lab `ObsidianPublicCharacterProfile`) is explicitly **not** a portable slot — consistently documented (Bible §26, CONTRACT_BASELINE "Surface truth") and consistently implemented; keep it that way when the concurrent edits' `page-models/characterProfile.ts` lands (verify it stays a core-owned surface, not a Design slot).

---

## Verdict

**READY for authoring new Design folders** — contingent on landing the concurrent F1 cleanup and the documentation authority fixes (F4/F5), both of which are in progress as of this audit's close. The compile-time portability architecture, the exact source parity, and the parity-gate machinery are proven by direct re-execution, not just by reading the committed evidence.
