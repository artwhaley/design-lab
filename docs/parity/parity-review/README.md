# Obsidian parity review packet

This packet is the Phase 2 automated evidence for the production Obsidian oracle versus the Design Lab.

## Automated result

- 16 Class A surfaces × 3 viewports = 48 deterministic comparisons.
- Desktop: 1440×1000; compact: 1024×900; mobile: 390×844.
- Pixel threshold: 0.5%; observed maximum: 0.000%.
- DOM mismatches: 0 after the explicit runtime-noise normalization listed in manifest.json.
- Semantic input mismatches: 0.
- Asset mismatches: 0.

Use manifest.json for the machine-readable result, the viewport directories for side-by-side production/Lab/diff images, dom/ for canonicalized DOM captures, and inputs/ for production-oracle input records.

## Human review and approval

P2-GATE was not satisfied by automation alone. The packet was reviewed side by
side with the running production and Lab hosts for the packet's Class A list,
including one shared editor/tool inside Shell and the Site Studio preview. The
review covered navigation order and active state, OperatingContext, typography,
atmosphere/default imagery, geometry, dialogs/menus/portals, Records controls,
management workbenches, empty states, Studio override/reset, and mobile
media-query behavior.

Also review the folder-tree parity output, production-oracle JSON comparison, and the P2-T13 Lab-to-production portability note before approving the gate.

The owner approved the exact gate sentence in the task conversation:

> The Design Lab is sufficiently contract-identical and render-faithful to production to author new LoreForge Design folders for direct compile-time installation.
