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

Pinned Compose Material 3 supplies default values, state transitions, Expressive
variants, spring behavior and upstream test cases. Reuse one clean shallow/sparse
AndroidX checkout, pinned by policy, as a read-only reference. `source prepare`
generates a hashed index of source paths, token expressions, samples and tests.
The index is a navigation aid: inspect the linked Kotlin for overloads, delegated
defaults, multiline expressions, platform implementations and tests missed by
filename matching. It is not an exhaustive Kotlin parser or a parity certificate.

Material website guidance fills gaps, including interaction and motion.
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

### Shared family research

The workbook's existing mappings project into **family → variants → task slices**.
`routing.mjs` groups shared Compose references (plus filled/outlined TextField and
Tab/TabRow research) without merging exports, acceptance rows or task history.
Figma-only/Web-only mappings retain their own owner until source resolution links
them or assigns a shared native export; sharing a kit node alone never merges unrelated semantics. No second backlog
or manually synchronized family inventory is created.

Default briefs show each family once. They link one canonical evidence record at
`sources/families/family-CM-NNNN.json`, identified by the earliest mapping ID in that
family. Use `task show ID --full` to inspect the deduplicated platform references
during initial resolution. After preparation, default briefs show selected concern
routes; full Kotlin/test/token inventories remain opt-in.

Resolve this record just in time for the first family slice, then reuse it:

- `schemaVersion: 1`, `familyId` and `scopeSha256` from the task's family brief;
- `pins: {figma, compose, web}` containing the policy digests/commits;
- `coverage` for each of `figma`, `compose`, `web`: `status: "present"` or `"absent"`
  and a repository-relative `evidence` file. Absence also needs the lookup `reason`.
  Remove rejected candidate links from the workbook before declaring absence;
- `routes` for `design`, `behavior`, `motion`, `browser`: `primary`, boolean
  `figmaSpecified`, and repository-relative `evidence` containing the selected facts.
  Skipping the preferred available source requires `gapReason` and `gapEvidence`;
- optional `overrides` for individual dimensions: `dimension`, `primary`,
  `figmaSpecified`, `reason` and `evidence`. Keep exceptions here for every sibling
  task to reuse, not in divergent task-specific copies.

Design starts with Figma, then Compose, guidance and Web. Behavior/motion start with
Compose, then guidance and Web; Figma wins any detail it specifies. Browser semantics
start with Web, then `web-platform`. The latter means evidence from web standards or
established native browser behavior/tests, not Android semantics. A present source can
still lack a particular concern: record that specific gap rather than declaring the
whole platform absent. A source unique to one platform does not require fabricating
equivalents on the others. An unlinked source remains unresolved until checked once.

Task baseline `decisions` match these selected routes. `concern` defaults to `design`;
use `behavior`, `motion` or `browser` where appropriate. When a task spans families,
each decision identifies its `familyId`. Task-specific visual scenarios and acceptance
remain in the task baseline; resolved family facts and exceptions are shared.
`task prepare` rejects conflicting task decisions, stale sibling scope/pins and
unsupported precedence changes. It hashes the shared records and their evidence;
verification/QA archive and recheck them. Implementation agents read the selected
facts, reopen only named gaps or changed inputs, and do not repeat a three-platform
comparison on each task.

1. Resolve Figma-first references and media for foundations.
2. Reconcile the complete Figma/Web/Compose union, including Expressive families
   absent from Web, then establish the native package and canonical token graph.
3. Build the foundation gallery: color, type, shape, spacing/density, elevation,
   icons, state layers and motion. Verify scoped overrides and built/native-only
   rendering. Human QA and merge gate component work.
4. Implement required shared behavior, then native Button/TextInput pilots.
5. Prepare the next two dependency-ready outcomes. Rank foundations and shared
   blockers by the required outcomes they unlock, then task priority. Source
   overlap does not outrank required Expressive work.
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
export M3_ANDROIDX=/path/to/pinned/androidx
node internal/material3-migration/cli.mjs help
node internal/material3-migration/cli.mjs source prepare
node internal/material3-migration/cli.mjs workbook upgrade
node internal/material3-migration/cli.mjs status --json
node internal/material3-migration/cli.mjs source motion --limit 12
node internal/material3-migration/cli.mjs task prepare M3-SRC-002
node internal/material3-migration/cli.mjs task pop
node internal/material3-migration/cli.mjs task show M3-SRC-001 --full
```

`M3_DEPS` contains `@oai/artifact-tool`, `pngjs` and `jszip`. In Codex, obtain the
bundled dependency directory through its workspace-dependency tool. `--repo` or
`ASTRYX_REPO` selects the checkout; `--workbook` overrides `M3_WORKBOOK`.

`workbook upgrade` makes the additive v2→v3 change once, preserving existing task
IDs, claims, QA and history. Repeating it under the same policy does not write.
New source rows start unresolved, never approved. Policy and source-index hashes
must match before work continues. No checkout is cloned, fetched or repinned by
the harness. For a new shallow checkout, fetch the exact policy commit and use a
sparse working tree containing `compose`, `graphics/graphics-shapes` and
`test/screenshot`. The pinned implementation can predate some kit changes;
resolve those differences explicitly.

`--json` returns one `{apiVersion,type,data}` envelope. Errors have a stable code,
message and next commands, with exit status 1. `--dense` emits compact JSON;
`--full` expands task acceptance rows. The command manifest owns help and mutation
classification (`writesWorkbook`). Media helpers write their explicitly requested
output files. Text/JSON are projections of the same result. Reads never claim work.

A temporary adjacent `task.mjs` forwards old invocations into this CLI. It owns no
verification logic and can be deleted when callers use this entry point.

## State and completion

`Backlog → Claimed → Awaiting QA → Approved → Closed`

- `task prepare ID --baseline path/to/source.json`: resolve and hash the selected
  source packet before implementation. Source/planning work can prepare without
  a resolved visual baseline. The packet owns no execution state. Changes to source
  decisions, mapped scope, policy or referenced files invalidate preparation.
- `task pop`: choose a prepared, dependency-ready outcome, claim it atomically and return
  source links, Figma nodes, governing records, acceptance dimensions and next steps.
  One active claim and a full QA queue stop new claims. WIP and the preparation
  buffer are policy values, not a reason to increase parallelism by default.
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

`status` reports elapsed implementation, QA wait, merge wait and blocked stages,
queue age, rejections, observed closures in seven days and median claim-to-close
time. Tracking starts at upgrade; it never fabricates older durations. Elapsed
time includes idle time and is not worker effort. Inspect which queue or rework
actually limits accepted delivery, improve that constraint, then measure again.

## Verification recipes and evidence

Task-specific recipes live under `verification/TASK_ID.mjs`. They execute focused
product tests/browser checks, emit a JSON receipt on stdout, and put diagnostics on
stderr. They must not edit the workbook or set arbitrary checklist rows to Pass.
Permanent behavior tests belong beside the product code; recipes only orchestrate.

A receipt includes:

- `strategyId`, `taskId`, current `revision`, `materialWebCommit`, `androidxCommit`
  and `baselineId`;
- `checks`: every policy requirement with `result: "Pass"` and repository-relative
  `evidence` files (a documented N/A decision can itself be evidence);
- `qaChecks`: states, keyboard, theme, responsive, motion and accessibility, each
  with Pass/N/A and a concrete reason;
- `reviewKind`: visual for implementation, document for architecture/planning;
- `preview`, `sourceDecision`, `sourceDecisionSha256` for visual work;
- `tokenIds` for foundation coverage;
- `visualComparisons`, `motion`, `upstreamTests` and `performance` as described below.

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
- `baselineId`, `compose.commit`, `compose.inventory`, `compose.tests` (unique
  `id` and pinned `source` for each selected upstream test case). Missing upstream
  tests require an empty list with `compose.reason` and `compose.evidence`;
- `guidance`: official URL, `capturedAt`, and repository-relative `capture`;
- `decisions`: dimension, boolean `figmaSpecified`, chosen source (`figma`, `compose`, `website`
  or `web`), reason and evidence file. When Figma specifies it, chosen must be figma;
- `scenarios`: unique IDs, sourceReference, expected PNG `baseline`, and environment;
- `motion`: applicability, reference media path/hash or a source-backed N/A reason.
- `performance`: approved browser/device profiles and measured budgets below.

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

For spring/trajectory motion, the baseline adds `motion.numeric.applicable: true`
and `traces`: unique `id`, independent upstream `reference` JSON, `unit`,
`positionTolerance`, `velocityTolerance`, `settlingToleranceMs`, and a real human
`approvalReference`. Numeric N/A requires `reason` and source `evidence`.
The receipt adds `motion.traces: [{id, actual}]` pointing to browser recordings.
Each recording has `unit`, identical nonempty `inputs` (including interruption
time/velocity/target changes), `settledAtMs`, and at least three aligned `samples`
of `{timeMs, position, velocity}` through settling. The reference producer declares
`kind: "upstream"`, pinned `commit`, executed `source`, `command` and `runtime`;
the actual producer declares `kind: "browser"` and its capture `command`.
The verifier recomputes errors. Self-reported provenance still requires review:
use outputs from executing upstream Kotlin or independently captured native
behavior, never numbers produced by the browser implementation under test.

### Upstream tests and browser response

For each selected Compose test, the receipt's `upstreamTests` entry supplies its
`id`, `result` (Pass/N/A), `reason`, `evidence`, and permanent `nativeTest` path
for Pass. Translate assertions into web semantics; do not transplant Android
focus/accessibility behavior where it conflicts with browser requirements.
N/A decisions remain visible to human QA.

Each baseline performance profile has a unique `id`, `approvalReference`, exact
`environment` (at least browser/version and device), `maxInputLatencyMs`,
`frameBudgetMs`, `maxLongFrameRatio`, `minInputSamples` and `minFrameSamples`.
The receipt supplies `performance: [{id, actual}]`; that JSON contains the same
environment plus measured `inputLatencyMs` and `frameIntervalsMs` arrays.
The harness checks maximum response time and the fraction of frame intervals
over budget. Sampling method, refresh rate, warmup, interaction scenarios and
device constraints belong in the reviewed profile/capture recipe. Budgets must
come from the approved target profile; the harness invents no universal number.
Verify active animation and interruption, not only an idle screenshot.

## Workbook ownership and presentation

Task records own execution state; mappings own source links and scope; acceptance
rows own applicability/evidence; Reviews preserve human decisions. Status summaries
are derived. Access table columns by header names, never silent numeric offsets.

All cell authoring uses Artifact Tool. Its documented API lacks sheet visibility/
ordering controls, so `presentation.mjs` changes only workbook XML tab presentation
using JSZip after export. Cell data, formulas, styles and IDs are retained. Six
visible working tabs are reapplied after every write; reference sheets remain,
including the new hidden Compose inventory.

## Delete after migration

`audit` rejects unresolved required source rows, missing native owners, incomplete
tokens/checks, unmerged tasks and unapproved exclusions. `--full` expands blockers.
Once coverage passes, run `audit --retire-check` from a clean committed checkout.
It archives HEAD into a fresh temporary directory, removes the harness and guide,
checks product dependencies, then installs/builds/runs permanent tests from the
policy commands. Command logs and a revision/policy-bound receipt accompany the
workbook. This gate remains blocked until the native package has its permanent
build/test scripts; the migration harness cannot supply those tests for it.

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
