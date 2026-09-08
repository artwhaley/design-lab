# Adding a Design to the Lab

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

Do not add a registry import. Discovery scans `design.manifest.json` files and
generates the catalog and registry:

```bash
npm run design:discover
npm run design:check
```

The production folder is the source oracle for shared contracts. From the Lab
checkout, run the complete parity gates with an explicit production path:

```bash
npm run test:parity -- --production ..\sl-civic-archive
npm run parity:folder -- --production ..\sl-civic-archive --check-assets
```

## 3. What the Design owns

Everything inside `src/designs/<key>/` is portable Design code:

| File | Purpose |
| --- | --- |
| `design.manifest.json` | Installable key, contract version, metadata, thumbnail |
| `index.ts` | Production `DesignDefinition` and complete slot tree |
| `config.ts` | Versioned defaults, validation, migration, theme variables |
| `assets/` | Thumbnail and bundled fonts/images |
| `*.tsx` / `*.css` | Design-owned Shell, pages, controls, and presentation |

The host (`src/host/`), Lab fixtures (`src/fixtures/`), emulators, and
contract mirrors are not copied into production. If a surface needs a fact
that is absent from the production model, record the pressure and keep the
adaptation in the Lab host until the contract owner resolves it.

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

- Every required production slot renders a real implementation.
- Actions are consumed through supplied props or sanctioned host bridges.
- Empty, loading, error, and unavailable-capability states are visible.
- Config validates strictly, migrates all supported versions, and emits the
  complete base token set.
- `npm run build`, `npm test`, `npm run test:e2e`, and `npm run design:check`
  pass.
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
