# LoreForge Design Lab agent rules

- Current owner acceptance is functional folder portability. Read
  `../FUNCTIONAL_DESIGN_PORTABILITY.md`; source hashes are diagnostic, not a
  requirement to install a Design. Preserve ignored `.design-local/` scratch.

- The Lab is a **production-consumer harness**, never a second Design API. The
  design-facing contract is the production `DesignDefinition` in
  `src/lib/design/types.ts` (byte-identical to production) — read
  `docs/CONTRACT_BASELINE.md` and `docs/ADDING_A_DESIGN.md` before touching
  anything under `src/designs/**` or the generated registry.
- The production checkout is the oracle: `docs/CONTRACT_BASELINE.md` names the
  mirrored modules, and `npm run parity:check-production` and
  `npm run parity:folder` enforce byte-identical parity.
- A Design folder must be portable: discovered from its folder + manifest
  (auto-constructed if absent), no registry/route/host edits, no
  cross-Design imports, no folder-boundary escapes, and only the authorized
  API seam (`npm run design:audit`).
- Do not invent Lab-only design contracts, page slots, or bridge props in
  `src/designs/**`; host-only machinery lives under `src/host/`, `src/preview/`,
  `src/fixtures/`, and `src/workspaces/` and must stay outside portable
  folders.
- Run the full gate before declaring a Design ready: `npm run build`,
  `npm test`, `npm run design:check`, `npm run design:audit:check`,
  `npm run test:parity -- --production <path>`, and (when servers + a browser
  are available) `npm run test:cross-host`.
