# Temporary Material 3 migration harness

This tool exists to finish the migration and is deleted afterward. The existing
XLSX is the sole task database. Source inventories, dependency edges and historical
QA remain in it; only six working sheets are visible. Hidden sheets can be unhidden
for research. There is no replicated backlog in this directory.

## Objective and source authority

Figma wins wherever it specifies the design. Pin the supplied export by SHA256 and
identify its exact component nodes, variants, variable modes and style references.
Read dimensions and bindings; inspect exported frames. A family-name match means
candidate coverage, never proven equality. Do not use a reconstruction of our own
component as its expected image.

Material website guidance fills Figma gaps, including interaction and motion.
Capture the relevant HTML-rendered guidance with URL and capture date. Watch its
GIFs/videos at normal speed, then inspect timed frames. A text scraper, video URL,
poster frame or easing token alone does not establish what the motion does.

Pinned Material Web supplies implementation and browser-behavior evidence. It may
implement a different generation of Material. Record each difference and implement
the Figma design where specified; never silently reduce Figma to Web's coverage.
Preserve accessibility, keyboard and form requirements while implementing the design.
Unresolved design evidence blocks verification. A gap needs a chosen reference and
reason, not a guessed value or an average of incompatible sources.

## Workflow

1. Resolve Figma-first references and media for foundations.
2. Establish the native package and canonical token graph.
3. Build the foundation gallery: color, type, shape, spacing/density, elevation,
   icons, state layers and motion. Verify scoped overrides and built/native-only
   rendering. Human QA and merge gate component work.
4. Implement required shared behavior, then native Button/TextInput pilots.
5. Among dependency-ready outcomes, prioritize components represented in both
   Web and the Figma inventory. Coverage is a scheduling aid, not approval.
6. Cover remaining Web components, Figma/website-only components and patterns,
   then explicitly classified extensions. Missing from Web never means out of scope.

Each task delivers a reviewable outcome with references, scope, checks, preview and
completion evidence. Workbook Tasks and Dependencies own actual sequencing.
`task pop` returns its joined brief; do not ask an agent to read every source tab.

## Run

Use Node matching the repository. Configure the existing workbook and external
migration-only dependencies; do not add these packages to product dependencies:

```sh
export M3_WORKBOOK=/path/to/astryx-material3-migration-inventory.xlsx
export M3_DEPS=/path/to/tooling/node_modules
node internal/material3-migration/cli.mjs help
node internal/material3-migration/cli.mjs status --json
node internal/material3-migration/cli.mjs source motion --limit 12
node internal/material3-migration/cli.mjs task pop
node internal/material3-migration/cli.mjs task show M3-SRC-001 --full
```

`M3_DEPS` contains `@oai/artifact-tool`, `pngjs` and `jszip`. In Codex, obtain the
bundled dependency directory through its workspace-dependency tool. `--repo` or
`ASTRYX_REPO` selects the checkout; `--workbook` overrides `M3_WORKBOOK`.

`--json` returns one `{apiVersion,type,data}` envelope. Errors have a stable code,
message and next commands, with exit status 1. `--dense` emits compact JSON;
`--full` expands task acceptance rows. The command manifest owns help and mutation
classification (`writesWorkbook`). Media helpers write their explicitly requested
output files. Text/JSON are projections of the same result. Reads never claim work.

A temporary adjacent `task.mjs` forwards old invocations into this CLI. It owns no
verification logic and can be deleted when callers use this entry point.

## State and completion

`Backlog → Claimed → Awaiting QA → Approved → Closed`

- `task pop`: choose a dependency-ready outcome, claim it atomically and return
  source links, Figma nodes, governing records, acceptance dimensions and next steps.
- `task block ID --reason ...`: hold active work. `task unblock ID` releases that
  manual hold; hard dependencies still apply. Retain the branch and existing work.
- `task verify ID`: run its focused verifier, validate evidence and prepare QA.
- `task review ID`: return preview, selected references, comparison frames and motion
  observations so a human knows what to compare and what to interact with.
- `task qa ID approve --reference ...`: record the actual human approval at that SHA.
  Never manufacture approval. Rejection returns the task to implementation.
- `task finish ID --pr URL`: require the approved head merged into main, passing CI,
  the merge available under local `origin/main`, and the recorded secondary task worktree removed. The primary checkout is never a
  cleanup target.
  Run from an integration checkout after normal safe cleanup. This command performs
  read-only GitHub/Git checks; it never merges or deletes anything itself.

Only Closed satisfies dependencies. Native component/token completion additionally
requires the merged flag. Historical legacy approvals remain separately recorded.
Policy version/hash mismatch, graph cycles, missing references, partial checks and
stale evidence fail closed. All XLSX mutations use one lock and atomic replacement.
The last content hash catches writes by tools that ignored that lock.

## Verification recipes and evidence

Task-specific recipes live under `verification/TASK_ID.mjs`. They execute focused
product tests/browser checks, emit a JSON receipt on stdout, and put diagnostics on
stderr. They must not edit the workbook or set arbitrary checklist rows to Pass.
Permanent behavior tests belong beside the product code; recipes only orchestrate.

A receipt includes:

- `strategyId`, `taskId`, current `revision`, and `materialWebCommit`;
- `checks`: every policy requirement with `result: "Pass"` and repository-relative
  `evidence` files (a documented N/A decision can itself be evidence);
- `qaChecks`: states, keyboard, theme, responsive, motion and accessibility, each
  with Pass/N/A and a concrete reason;
- `reviewKind`: visual for implementation, document for architecture/planning;
- `preview`, `sourceDecision`, `sourceDecisionSha256` for visual work;
- `tokenIds` for foundation coverage;
- `visualComparisons` and `motion` as described below.

The verifier computes `revision` at runtime. The harness stores immutable receipts
next to the workbook in `.m3-receipts`, with content-addressed copies of referenced
files. They are evidence, never another task database. Captures survive worktree
cleanup; approval checks their hashes, and finish checks the archived copies.
Do not attempt to commit a receipt containing its own commit SHA. Changed evidence
requires a new revision and verification. Evidence paths must remain within the
checkout, including after resolving symlinks.

### Selected visual baseline

`sourceDecision` points to a versioned JSON file with:

- `authority: "figma-first"`;
- `web.commit`, `figma.sha256`, `figma.inventory` (repository-relative extracted
  inventory with node IDs and provenance);
- `guidance`: official URL, `capturedAt`, and repository-relative `capture`;
- `decisions`: dimension, boolean `figmaSpecified`, chosen source (`figma`, `website`
  or `web`), reason and evidence file. When Figma specifies it, chosen must be figma;
- `scenarios`: unique IDs, sourceReference, expected PNG `baseline`, and environment;
- `motion`: applicability, reference media path/hash or a source-backed N/A reason.

Foundation baselines resolve all eight dimensions from `policy.json`; each scenario
lists its covered `dimensions`, with every foundation covered in light and dark. Capture both
light/dark, representative viewport/RTL/zoom cases and variants/states identified
by the workbook; a recipe must substantively assert its coverage. The generic runner
validates files, pixels, workflow and declared coverage, and cannot itself infer all
missing states from a screenshot. Review the baseline matrix before implementing.

Each environment records browser/version, OS, DPR, viewport, fonts (including file
hashes and loaded state), theme, content and state. Actual comparisons carry the same
`environment`, scenario `id`, captured `actual` PNG and `diff` image. Motion scenarios
also carry matching `timeMs`. Pin crop/scale and assets before comparing. No resizing,
blurring, masking or font substitution to hide a mismatch.

The comparator remeasures RGBA pixels; it does not trust a reported Pass. The default
is zero changed pixels. A Figma export and browser may rasterize differently: any
nonzero `tolerance` needs changedPixels/maxChannelDelta limits, a reason and an
explicit human `approvalReference`. A tolerance is an exception, never a global
shortcut. Do not call a tolerated mismatch exact pixel equality.

```sh
node internal/material3-migration/cli.mjs compare expected.png actual.png --diff difference.png
```

### Motion evidence

Use local clips captured from the selected source. With `ffmpeg` and `ffprobe`
on PATH, this helper preserves the original, extracts the nearest decoded frames
and reports their actual timestamps (which may differ from requested times):

```sh
node internal/material3-migration/cli.mjs motion inspect reference.webm --times 0,120,240 --out /path/to/new-inspection
```

It emits individual PNGs, a contact sheet and `frames.json`. Read the contact sheet
left-to-right/top-to-bottom using its frame manifest. Always play the original too;
extraction does not set watchedBy or claim a motion review. Never substitute a
requested timestamp for the actual decoded frame time.

For applicable motion, the receipt records `reference`, `referenceSha256`,
`actualRecording`, `watchedBy`, `watchedAt`, a timestamped `contactSheet`, and
timed `observations`. Watch both reference and native recording at normal speed.
Describe what moves, direction/path, duration, easing or spring response, stagger,
shape/opacity changes and settling. A clip review is a recorded observation; the
CLI cannot prove that an agent actually watched it.

Include aligned intermediate frame comparisons and scenario evidence for enter,
exit, interruption, reversal and reduced motion. A scenario can be N/A only with
source-backed reasoning. Verify focus/interaction during transitions as applicable.
Static components explicitly declare motion N/A. Never substitute a static endpoint
screenshot or a duration value for reviewing the animation.

## Workbook ownership and presentation

Task records own execution state; mappings own source links and scope; acceptance
rows own applicability/evidence; Reviews preserve human decisions. Status summaries
are derived. Access table columns by header names, never silent numeric offsets.

All cell authoring uses Artifact Tool. Its documented API lacks sheet visibility/
ordering controls, so `presentation.mjs` changes only workbook XML tab presentation
using JSZip after export. Cell data, formulas, styles and IDs are retained. Six
visible working tabs are reapplied after every write; ten reference sheets remain.

## Delete after migration

Archive the final workbook/receipts/source captures with release evidence. Retain
public contracts, source attribution, component docs and product regression tests.
Then remove this whole directory, the adjacent compatibility launcher, the temporary
migration guide and its AGENTS/docs links. No production package may import this
folder. No task execution state is required by a published component or theme.

## Focused harness checks

```sh
pnpm vitest run --project node internal/material3-migration/tests/harness.test.mjs
```

Use adversarial fixtures for missing source evidence, Figma precedence violations,
partial motion, differing pixels, stale approvals, unmerged heads and retained
worktrees. These test the guard, not the visual correctness of future components.
