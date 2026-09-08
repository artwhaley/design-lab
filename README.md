# LoreForge Design Lab

A deliberately small, standalone **contract emulator and presentation
workbench** for first-class LoreForge Designs. It lets visual/design agents
create complete Designs against a stable semantic contract without building
their own preview application or reverse-engineering the production
repository.

The Lab is **not** a second LoreForge application or a second Design API:

- no Payload, no database, no authentication, no real tenant resolution;
- no production authorization evaluation;
- no production API handlers or migrations;
- no duplicate document editor or workflow engine;
- no generic plugin loader or arbitrary third-party Design loading.

Authoring rule:

> You are authoring a production LoreForge Design folder inside the Lab.

The folder under `src/designs/<key>/` is copied unchanged to production after
the parity and portability checks pass. The Lab's fixtures, fake workspaces,
route simulator, API/form emulator, Next shims, and outer authoring chrome are
host infrastructure and must stay outside the portable folder.

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
| `npm run test:e2e` | Full iframe/browser regression |
| `npm run test:parity -- --production <path>` | Production contract, source, asset, and surface parity gate |
| `npm run test:cross-host` | Live production-vs-Lab DOM/layout/pixel evidence |
| `npm run new-design -- <key> "<Name>"` | Scaffold a production-shaped Design folder |

## Layout

```text
src/lib/design/   production-shaped Design contract, config, registry, and fixtures
src/lib/page-models/
                  production-shaped semantic Page Models
src/fixtures/     deterministic Aster Reach fixture universe + scenario factory
src/workspaces/   fake shared workspace/controller implementations (host-owned)
src/host/         Lab chrome, path simulator, scenario/Studio/compare controls
src/designs/      discovered production-shaped Designs; copy unchanged to production
src/tests/        contract, fixture, workspace, registry, conformance suites
docs/             contract baseline, authoring guide, pressure log
```

`src/contracts/` may still exist for isolated legacy probe/test fixtures, but
it is not the author-facing contract and must not be imported by a portable
Design. See `docs/CONTRACT_BASELINE.md` for the frozen contract version,
production reconciliation notes, and the exact 16-slot Class A tree.

Each installable Design must include `design.manifest.json`, a default-export
entrypoint, and bundled defaults under `assets/`. Discovery generates the
catalog/registry and materialized `/design-assets/<key>/` output; do not hand
edit those generated files.
