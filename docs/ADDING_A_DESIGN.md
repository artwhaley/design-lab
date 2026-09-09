# Adding a Design to the Lab

Current handoff acceptance is **functional portability**, not source hashes. See
`../../FUNCTIONAL_DESIGN_PORTABILITY.md`. Both `dev` and `build` run discovery.
Host-only scratch may travel in `<key>/.design-local/`, which both hosts ignore.
Use `npm run test:dropin -- <key>` and `PARITY_DESIGN=<key>` for per-Design proof.

The Lab is a production-consumer harness. A Design folder is portable: after
it passes the Lab gates, the same `src/designs/<key>/` tree is copied unchanged
into production and discovered from its manifest. The Lab host owns adapters,
fixtures, fake workspaces, and browser transport outside that folder.

## 1. Scaffold

```bash
npm run new-design -- night-harbour "Night Harbour"
```

The scaffold writes a manifest, versioned config, the current 16-slot
production tree, Studio editor, thumbnail, and bundled asset directory. The
tree includes `pages.members` and `pages.management.person`; there is no
`pages.member` slot. It validates the key format, refuses to overwrite an
existing Design, and runs discovery.

## 2. Discover and check

Do not add a registry import — there is no registry to edit. Discovery scans
`src/designs/` for folders and generates the catalog and registry:

```bash
npm run design:discover
npm run design:check
```

If `design.manifest.json` is absent, discovery CONSTRUCTS it from the
Design's own `DesignDefinition` (`key`, `name`, `description`, thumbnail)
before validating — a new folder is discoverable the moment it exists, with
no hand-written manifest, registry, route map, or host edit. The generated
output is deterministic and LF-normalized.

The production folder is the source oracle for shared contracts. From the Lab
checkout, run the complete parity gates with an explicit production path:

```bash
npm run test:parity -- --production ..\sl-civic-archive
npm run parity:folder -- --production ..\sl-civic-archive --check-assets
npm run design:audit
```

## 3. What the Design owns

Everything inside `src/designs/<key>/` is portable Design code:

| File | Purpose |
| --- | --- |
| `design.manifest.json` | Installable key, contract version, metadata, thumbnail (auto-constructed at discovery if absent) |
| `index.ts` | Production `DesignDefinition` and complete slot tree |
| `config.ts` | Versioned defaults, validation, migration, theme variables |
| `assets/` | Thumbnail and bundled fonts/images |
| `*.tsx` / `*.css` | Design-owned Shell, pages, controls, and presentation |

The host (`src/host/`), Lab fixtures (`src/fixtures/`), emulators, and
contract mirrors are not copied into production. If a surface needs a fact
that is absent from the production model, record the pressure and keep the
adaptation in the Lab host until the contract owner resolves it.

### CSS modules

All `.module.css` files compile with the production-shaped naming scheme
`{fileBase}-module__{hash}__{local}` — the same shape Next.js emits — so the
cross-host DOM comparator compares any Design's class names cleanly. There
are no per-Design pins in `vite.config.ts`; the comparator strips the hash
segment. Do not add global (`:global`) selectors; keep every rule under the
Design's own class namespace.

### Mutations

Consume mutations through the documented seam: the shared workspaces
(`useRecordsWorkspace`, `useFolderManagementWorkspace`), the route-supplied
action props (`workflowAction`/`deleteAction`/`approveAction`/`rejectAction`),
and the authorized API endpoints listed in `CONTRACT_BASELINE.md`. `npm run
design:audit` fails on unknown `/api/*` references and on host code importing
from `@/designs/*` (only the generated registry may).

## 4. Exercise the contract

Use the Scenario tab to cover `visitor`, `member`, `departmentManager`, and
`admin` personas with populated, empty, and stress data. Designs receive
already-authorized Page Models; they must render absence and denial exactly as
supplied and must not re-derive authorization.

Use Studio to verify the full config pipeline: saved bank, migration,
validation, theme resolution, preview update, save, revert, and defaults.
Use Compare with the same surface, scenario, and viewport to inspect stateful
behavior and mutation propagation.

## 5. Completion checklist

- Every required production slot renders a real implementation; the optional
  `characterProfile` slot renders or is honestly absent.
- Actions are consumed through supplied props, sanctioned host bridges, or
  the authorized API seam.
- Empty, loading, error, and unavailable-capability states are visible.
- Config validates strictly, migrates all supported versions, and emits the
  complete base token set.
- `npm run build`, `npm test`, `npm run test:e2e`, `npm run design:check`,
  and `npm run design:audit:check` pass.
- `npm run test:parity -- --production <path>` passes.
- `npm run test:cross-host` records current production-vs-Lab evidence.

## 6. Production handoff

1. Run the Lab gates and review `docs/parity/cross-host/results.json`.
2. Confirm `npm run parity:folder -- --production <path> --check-assets`.
3. Copy `src/designs/<key>/` unchanged into production and run production
   discovery/build checks.
4. Remove the temporary probe folder and rerun discovery/checks in both hosts.
5. Use the `production-preview` profile for the acceptance comparison. Do not
   mask authored text, navigation, classes, styles, or content, and do not edit
   the portable Design to compensate for Lab-only chrome or fake-data
   variation in an authoring-only scenario.
