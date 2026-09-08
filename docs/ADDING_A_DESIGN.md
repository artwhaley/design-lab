# Adding a Design to the Lab

This document is the commissioning path for Design #2 and beyond. It assumes
you have read `docs/CONTRACT_BASELINE.md` (the frozen contract snapshot) and
can reference `src/designs/contract-probe/` — the Contract Probe Design,
which is *executable documentation* of every surface.

## 1. Start command

```bash
npm run new-design -- <key> "<Name>"
```

Example:

```bash
npm run new-design -- obsidian-lab "Obsidian Lab"
```

The script copies `src/designs/_template/` to `src/designs/<key>/` and
renames every identifier (`Template` → `<Name>`, `template` → `<key>`,
`template.css` → `<key>.css`, …). It validates the key format and refuses to
overwrite an existing Design.

## 2. Registration (the only required source edit)

The template is never registered (it is a copy source only). After copying,
register the new Design by adding **one import** to `src/designs/index.ts`:

```ts
import './obsidian-lab'   // registers the Design (side effect)
```

The import must be placed in `src/designs/index.ts` — the host reads the
registry and must never import Designs directly (Guardrail 3). Registration
throws on duplicate keys, so a fresh key is required.

## 3. What the art agent owns

The Design author owns **everything inside `src/designs/<key>/`**:

| File | Purpose |
| ---- | ------- |
| `config.ts` | Config contract: `version`, `defaults`, `validate`, `migrate`, `resolveTheme` |
| `<Name>Shell.tsx` | Renders the supplied `DomainShellModel` |
| `<Name>Pages.tsx` | One component per required surface slot |
| `<Name>Studio.tsx` | Studio editor for this Design's config |
| `<key>.css` | Design-local scoped CSS (all selectors prefixed `<key>-`) |
| `DESIGN_BRIEF.md` | Visual direction — fill in first |
| `INTEGRATION_NOTES.md` | Contract coverage log for production handoff |
| `PAGE_MODEL_PRESSURE.md` | Facts the frozen contract cannot supply |

The host (`src/host/`), the workspaces (`src/workspaces/`), the fixtures
(`src/fixtures/`), and the contract types (`src/contracts/`) are **not** yours
to change for the sake of a Design. The only exception is the registry import
in step 2.

## 4. Using scenarios

The Lab re-seeds its fixture universe per scenario (persona × data state):

- **Personas:** visitor, member, departmentManager, admin
- **Data states:** populated, empty, stress

Open the **Scenario** tab in the right panel to switch persona/state, toggle
latency, force a read error, or make the next mutation fail. Designs receive
already-authorized Page Models; they must render absence and denial exactly as
supplied — never re-derive authorization (A07). Use *empty* to verify
empty-state rendering and *visitor* to verify limited capability rendering.

## 5. Using Studio

The **Studio** tab edits the active Design's config. The host handles the
full pipeline: saved bank → migration → validation → theme resolution. The
preview never sees raw config. Each Design keeps its own persisted config
bank (per-Design saved state), so switching Designs preserves each one's
settings. Save writes the validated config; validation errors block saving
and are shown in the panel.

## 6. Using Compare

**Compare** opens a second pane with a different Design at the same surface.
Both panes share one fake backend, so mutations in either pane update shared
state — the fastest way to judge two approaches against identical data.
Pick a surface with rich data (Records, Document, Work) and switch viewports
to compare responsiveness.

## 7. Contract pressure rule

The Lab contract snapshot is **frozen** (`docs/CONTRACT_BASELINE.md`). If
your Design genuinely needs a fact the Page Models cannot supply, record it
in `PAGE_MODEL_PRESSURE.md` (and `docs/CONTRACT_PRESSURE.md` if it is
Lab-wide) — do **not** patch the snapshot to fit the Design. The contract
evolves deliberately through the pressure pipeline, not by author fiat.

## 8. Dependency policy

Designs add **no runtime dependencies**. Everything visual comes from
Design-local CSS + the universal base tokens (`--tenant-*`) resolved from
your config. If a dependency seems unavoidable, raise it as an architecture
decision before adding it.

## 9. Completion checklist

- [ ] Every required surface slot renders a real implementation (no
      `data-stub-surface` remains)
- [ ] Interactive surfaces consume only their workspace / action-bridge props
- [ ] Absent actions/capabilities are not rendered as disabled controls
- [ ] Empty, loading, and error states are visible
- [ ] Config validates strictly; migration covers all previous versions;
      theme emits all 10 base tokens
- [ ] `npm run build` passes
- [ ] `npm test` passes — the conformance suite validates this Design once
      registered (slot presence, defaults, smoke renders)
- [ ] Compared against Contract Probe in Compare mode across viewports
- [ ] `DESIGN_BRIEF.md`, `INTEGRATION_NOTES.md`, `PAGE_MODEL_PRESSURE.md`
      are current

## 10. Production handoff

When the Design is commissioned:

1. Ensure `INTEGRATION_NOTES.md` documents every surface it covers and every
   decision taken.
2. Hand `PAGE_MODEL_PRESSURE.md` to the contract owner — these are the
   production contract gaps the Design surfaced.
3. The production integration adapter maps the fake workspaces the Design
   consumes to the real shared workspaces (see `docs/CONTRACT_BASELINE.md`
   and the production repo's workspace contracts).
4. The Design's config contract (`version`/`validate`/`migrate`) ships
   unchanged; production persists the same config shape.