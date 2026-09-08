# Obsidian Source Snapshot Baseline

The protected snapshot was copied byte-for-byte from:

- repository: `https://github.com/artwhaley/loreforge2`
- branch: `design/obsidian-incubation`
- frozen SHA: `fc22e6c7db7da05b6166e2f126c5e6c9e6a20223`
- source root: `design-incubator/obsidian/src/`
- destination: `src/designs/obsidian-lab/source/`

The manifest contains 27 protected files: the 8 source contract files, 18 portable source files, and the source preview reset copied as `preview-reset.css`. The preview router, mock workspace, and source fixtures were intentionally not copied.

Verification command:

```text
npm run verify:obsidian-source
```

The verifier checks every manifest hash and rejects added, removed, modified, or out-of-root snapshot files.

## Deliberate negative test

On 2026-09-08, one byte was temporarily changed in `source/config.ts`. `npm run verify:obsidian-source` failed with a `modified` entry and the expected/got SHA-256 values. The byte was then restored from the frozen source checkout; the same command passed with:

```text
Obsidian source snapshot verified: 27 protected files at fc22e6c7db7da05b6166e2f126c5e6c9e6a20223
```

No formatter or TypeScript repair was applied to the snapshot.
