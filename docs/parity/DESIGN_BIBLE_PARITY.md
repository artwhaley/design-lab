# LoreForge Design Bible — Parity Rules

This is the Phase 2 implementation addendum for authoring portable Designs.

## Non-negotiable seams

1. `src/designs/<key>/` is portable source. It contains the manifest,
   production-shaped entrypoint, config, bundled assets, and Design-owned
   presentation. It may import only the production Design contract, production
   Page Models, approved shared visual/behavior support, and the Design's own
   files. In the Lab those production import paths are mirrored or shimmed
   outside the portable folder; a Lab-only Design API is not author-facing.
2. The production checkout is the oracle for contract names, action shapes,
   route families, config resolution, and asset URL conventions.
3. The Lab owns only adaptations: fake data, fake workspaces, iframe
   navigation, Next shims, sanctioned API/form emulation, and visible host
   fallbacks. No Lab-only adapter is placed inside the portable folder.
4. Every first-class Design owns the same 16 Class A slots. `members` is a
   directory; `management.person` is the person workspace. There is no
   singular `member` slot.
5. The Design Shell mounts the production `OperatingContext` exactly once and
   owns the same navigation, main content, and footer boundaries in both hosts.

The current production shell model supplies primary navigation in this order:

```text
Home · About · Lore · Departments · Records
```

`routes.workUrl` is supplied separately; Obsidian adds Work exactly once.
Management navigation is separately authorized and must be rendered only when
supplied. The Lab's outer “Design Lab surfaces” rail is authoring chrome, not
the rendered Domain navigation and must not be used as evidence of a Design
shell link.

## Authoring loop

```text
scaffold → discover/check → Lab scenarios and Studio → Lab unit/e2e
→ production contract/source/asset parity → cross-host DOM/layout/pixel evidence
→ copy the unchanged folder → production discovery/build → remove probe
```

## Render review

Cross-host evidence uses the same production-oracle fixture models, browser,
viewport, fonts, timezone, and Design asset URLs. The deterministic production
oracle and Lab render the same semantic inputs, so the final packet compares
raw pixels and canonicalized DOM. Text, labels, authored classes, authored
styles, links, and content are not masked or accepted as content-only
variance. The completed matrix covers 16 Class A surfaces at
desktop `1440×1000`, compact `1024×900`, and mobile `390×844` (48 pairs).

The parity packet records production/Lab/diff images, DOM captures, semantic
inputs, asset SHA-256 values, font checks, and the exact normalization rules
in `docs/parity/parity-review/manifest.json`. A pixel delta, authored DOM
difference, asset mismatch, or semantic-input mismatch is a hard failure.
Runtime-only noise is normalized narrowly: generated React/Radix IDs and
hydration markers, server-action scaffolding, and react-arborist runtime
markers. CSS module scopes are matched to production-shaped Lab namespaces;
authored classes remain compared.

## Portability rule

The Lab-to-production probe must install a newly scaffolded folder unchanged,
pass production discovery and build, and leave no probe folder or generated
probe key behind. A failed probe is a contract seam to fix in the scaffold or
host boundary, not a reason to fork production rendering.

For a new Design, the folder's `design.manifest.json` is the only
author-authored registration record. Generated keys/catalog/registry and
`public/design-assets/<key>/` are build output and must be refreshed by the
discovery check rather than hand-edited.
