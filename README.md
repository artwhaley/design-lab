# LoreForge Design Lab

A deliberately small, standalone **contract emulator and presentation
workbench** for first-class LoreForge Designs. It lets visual/design agents
create complete Designs against a stable semantic contract without building
their own preview application or reverse-engineering the production
repository.

The Lab is **not** a second LoreForge application:

- no Payload, no database, no authentication, no real tenant resolution;
- no production authorization evaluation;
- no production API handlers or migrations;
- no duplicate document editor or workflow engine;
- no generic plugin loader or arbitrary third-party Design loading.

It emulates the **consumer side** of the LoreForge Design API: deterministic
authorization-safe fake Page Models, reusable fake workspace/controller
implementations, exhaustive surface navigation, persona/data/runtime
scenarios, per-Design config/Studio hosting with saved banks, responsive
viewport testing, and side-by-side Design comparison.

## Launch

```bash
cd design-lab
npm install
npm run dev
```

Open http://127.0.0.1:4173

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (port 4173) |
| `npm run build` | `tsc --noEmit` + Vite production build |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch |
| `npm run new-design -- <key> "<Name>"` | Copy the authoring template |

## Layout

```text
src/contracts/    frozen pure TypeScript Design contract snapshot
src/fixtures/     deterministic Aster Reach fixture universe + scenario factory
src/workspaces/   fake shared workspace/controller implementations (host-owned)
src/host/         Lab chrome, path simulator, scenario/Studio/compare controls
src/designs/      registered Designs (contract-probe, template, obsidian-lab)
src/tests/        contract, fixture, workspace, registry, conformance suites
docs/             contract baseline, authoring guide, pressure log
```

See `docs/CONTRACT_BASELINE.md` for the frozen contract version and production
reconciliation notes.