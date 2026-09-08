# <Name> — authoring checklist

This Design was copied from `_template`. Work through this list; do not ship
until every box is checked.

## Setup

- [ ] `DESIGN_BRIEF.md` filled in (concept, direction, scope)
- [ ] Registered: one import added to `src/designs/index.ts`
- [ ] `key` is a unique lowercase kebab-case slug; `name` is human-readable
- [ ] `config.ts` renamed to your real config axes; `TEMPLATE_*`/`template*`
      identifiers renamed; vars prefixed `--<your-design>-*`
- [ ] This README renamed/trimmed to your Design's own notes

## Surfaces — replace every stub

- [ ] Shell renders the supplied `DomainShellModel` (no invented nav)
- [ ] home, records, document, departments, department, about, lore,
      members, member, work
- [ ] management: departments, folders, roles, documentTypes, people,
      person, invitations
- [ ] Interactive surfaces use their workspace/action-bridge props only
      (never the backend, never fetch URLs)
- [ ] Absent actions/capabilities are not rendered as disabled controls
- [ ] Empty, loading, and error states are visible, not silent

## Config / Studio

- [ ] Config validation is strict; errors are actionable
- [ ] `migrate(fromVersion)` handles every previous config version
- [ ] Theme resolver emits all 10 base tokens + your vars
- [ ] Studio editor edits your config via `onChange` only

## Quality gates

- [ ] `npm run build` passes
- [ ] `npm test` passes (conformance suite includes this Design if it is
      registered)
- [ ] Compared side-by-side against Contract Probe in Compare mode
- [ ] Checked across viewports (mobile/tablet/desktop presets)
- [ ] `INTEGRATION_NOTES.md` and `PAGE_MODEL_PRESSURE.md` up to date