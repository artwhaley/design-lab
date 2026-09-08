# Obsidian fidelity pressure register

## T09 static/public adapters

- Lore: the frozen source page supports a separate introduction, per-entry
  revision label, and article body. The Lab `LorePageModel` supplies entries,
  summaries, optional revision labels, and canonical links, but no introduction
  or article body. The adapter uses the frozen source overview/index with empty
  values for unavailable source-only fields; it does not invent copy. The Lab
  page props also do not expose `route.params.loreSlug`, so the source article
  view is not selected inside the Design. Route-selection pressure remains
  recorded for a future generic page-prop decision.

- Member profile: the frozen source profile expects one department, one role,
  and a focus/detail claim. The Lab `MemberPageModel` supplies plural
  departments/roles and recorded work instead. The adapter preserves the
  source profile composition and only renders those supplied facts; it does
  not collapse relationships or invent a focus claim.

- Members directory: the frozen source has no dedicated public Members
  directory. `MembersAdapter` is therefore a clearly marked extension using
  source Obsidian CSS primitives and vocabulary, with no new authorization or
  workflow logic.
