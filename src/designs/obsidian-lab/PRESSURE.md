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

## T10 interactive adapters

- Records: the frozen source view exposes a fourth `Title Z–A` ordering and
  page-number controls, while the Lab workspace exposes only `newest`,
  `oldest`, `title`, and load-more semantics. The adapter exposes the truthful
  Lab orderings and translates the source page controls to the workspace's
  load-more operation; unsupported title-descending selection remains inert
  rather than creating a second ordering algorithm. Record menu hrefs remain
  ordinary card links because the frozen source callback API consumes them as
  actions and the Lab RecordsWorkspace has no navigation callback.

- Folder manager: the frozen Arborist component owns local search/sort and
  reports rename/move actions as labels rather than stable ids/parent ids. The
  adapter synchronizes row selection/search with the Lab workspace, resolves
  uniquely named folders for rename/delete, and provides a source-styled move
  dialog for an explicit target parent. Drag-move remains a source callback
  limitation; no inferred target is sent to the workspace.

- Document types: the frozen tree owns local selection and emits action labels.
  The adapter mirrors selected document-type ids into the Lab workspace and
  maps create/duplicate/archive/rename operations where the workspace exposes
  them. Source-only destructive Delete and drag-move operations are not
  translated into unsupported Lab mutations.

## T11 management and department pressure

- Department detail: the Lab `DepartmentPageModel` supplies active membership
  and department-owned folder names, but no reporting or parent relationship.
  The frozen Syncfusion chart requires explicit `parentId` edges. The adapter
  therefore keeps the source directory header, tabs, and panel vocabulary but
  renders a truthful member directory in the chart region. No parent edges are
  inferred or added to fixtures. This region remains a visual-waiver candidate
  for T12/T13; the frozen chart component remains protected and unused on this
  missing-semantic path.

- Work, Roles, People, Person, and Invitations use source Obsidian CSS/control
  vocabulary and Lab workspaces for behavior. The frozen generic management
  component is used where its row/create contract is semantically compatible
  (Departments); interactive surfaces with materially different action or
  search contracts use thin adapter extensions rather than duplicating business
  rules. Workspace capability and mutation methods remain authoritative.

- The frozen generic management component exposes fixed Edit/Archive labels and
  an uncontrolled local search callback. Roles and invitation requests have
  assign/approve/deny/revoke semantics, and People search is controlled by the
  Lab workspace, so those surfaces use source-styled adapter composition to
  avoid relabeling an unsupported mutation or creating a second search state
  machine. Unsupported source actions are not silently converted into new
  business operations.
