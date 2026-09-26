# Material 3 component migration

The migration target is a native Material 3 component system. The project owner
selected this direction on 26 September 2026 after the initial additive theme
and its first component integrations. The
[Material 3 family contract](../../packages/themes/material3/material3.spec.md)
owns the token and compatibility boundary. This guide projects that contract
into implementation and review. Existing Core contracts govern released Core APIs.

## One task database

`astryx-material3-migration-inventory.xlsx` is the migration database. Its
Tasks, Dependencies, Component mapping, Token mapping, Acceptance checks and
QA reviews sheets own execution state. Update that existing workbook in place.
Do not create a second backlog in an issue list, JSON file or document.

The [verification policy](material3-migration-policy.json) versions the shared
rules as `material3-native-v1`; it contains no task statuses or dependency graph.
The workbook records the policy ID and file hash. Its adjacent `task.mjs` reads
the policy from `ASTRYX_REPO` and checks both before a claim or completion.
Use a checkout containing the policy revision recorded in the workbook.

```sh
ASTRYX_REPO=/path/to/checkout node /path/to/tracker/task.mjs status
ASTRYX_REPO=/path/to/checkout node /path/to/tracker/task.mjs plan
ASTRYX_REPO=/path/to/checkout node /path/to/tracker/task.mjs pop
ASTRYX_REPO=/path/to/checkout node /path/to/tracker/task.mjs verify TASK_ID
ASTRYX_REPO=/path/to/checkout node /path/to/tracker/task.mjs qa TASK_ID approve --approval-reference 'Human decision for this revision'
```

`plan` reads the workbook without claiming. `pop` claims only dependency-ready
work. `verify` rejects an old contract, an unmet predecessor, a missing native
verification recipe, a dirty checkout or evidence for another revision.
`qa` records a real human decision; an agent must never manufacture that input.
All workbook writes use the existing exclusive lock and atomic replacement.

## Target implementation and compatibility

The planned native package is `@astryxdesign/material3` in `packages/material3`.
It owns Material component APIs, native styling and typed Material token access.
This package is a migration target, not a claim that its exports already exist.
Follow [AST-039](../specs/AST-039/spec.md) for discovery, same-stem `.doc.mjs`
files and integration configuration. Manifests locate directories; they do not
become item catalogs.

Native components consume supported Material component roles, with system and
reference roles below them. Match public CSS spellings from the pinned active
Material Web wrappers, including `--md-divider-color` and
`--md-sys-color-outline-variant`. Material Web component CSS names do not include
`comp`. Source-only motion, palette, geometry or tracking values need explicit
private implementation names and provenance. Do not present an unsupported
`--md-*` name as a Material Web public API.

Core token helpers and themed Core components are compatibility consumers.
Native component styling must not require `--color-*`, `--text-*`, `--radius-*`
or `--astryx-*` bridge declarations. Reuse behavior, focus, form, layout and
internationalization utilities only where their semantics match the Material
contract. When a styled Core component imposes conflicting anatomy, defaults
or states, implement the native component rather than expanding the Core API
solely to accommodate Material. Use CSS-native capabilities under the existing
StyleX guidance.

The canonical value graph flows from Material references and system roles to
Material component roles. Legacy aliases consume that graph in one direction.
Avoid copying resolved values into a second map: overriding a scoped Material
system token must update both the native component and its compatible legacy
alias. Test runtime and built CSS, light/dark modes and nested overrides.

`@astryxdesign/theme-material3` remains the Core compatibility entry point during
transition. Native components must render and behave correctly without it.
Existing Core imports and other themes retain their contracts. Audit consumers
and record replacement imports, codemods and deprecation criteria before
removing a released API in an explicitly approved major release. Removing
Astryx naming from native styling does not remove Meta or Google attribution,
license notices, or package provenance.

## Refactor completed work and sequence new work

The workbook contains the actual stories and hard edges. Apply these ordering
rules when maintaining it:

1. Establish the native package boundary, token API and compatibility plan.
2. Refactor the existing foundation into the canonical native token graph.
   Reuse pinned source values and fixtures; revalidate emission, overrides and
   runtime/build equivalence under the new boundary.
3. Review Icon/MaterialSymbol and Divider again through native entry points.
   Keep prior tasks and QA decisions as historical evidence. Reuse evidence
   only when the implementation, source and relevant observable behavior are
   unchanged, and record the new verification revision.
4. Provide shared focus, state/ripple and elevation behavior needed by the
   pilots, using their existing gap tasks. Wire the docsite and Storybook to
   the native package, fonts and theme selection.
5. Complete Button and TextInput as representative pilots, with independent
   interactive QA. TextInput includes the source filled/outlined field behavior
   through its existing field gap tasks.
6. Review both pilots, native dependency evidence and compatibility cost before
   resuming the wider component backlog. Claimed work whose new prerequisites
   are open becomes blocked with its branch and prior claim retained.

The workflow pilot that only exercised the old Core Button is superseded for
migration planning. It cannot satisfy either native pilot or its QA gate.
Classify each Astryx-only component as a native extension, a supported legacy
component, or outside scope with a reason. Do not count absence from Material
Web as evidence that Material 3 has no corresponding pattern; check Material
guidance and the design kit before making that decision.

## Implement and verify one slice

Start with the workbook mapping, pinned source, current direct component/family
owner and matching global baseline claims. A candidate Core component is a
reuse candidate, not an obligation. Record the native exported owner separately
from its legacy candidate. Preserve source, licensing and deliberate extensions.

Cover anatomy, variants, dimensions, touch targets, typography, shape, spacing,
elevation, icons and density. Check default, hover, focus-visible, pressed,
selected, disabled, invalid, loading, read-only and open states as applicable.
Verify pointer, touch, keyboard, forms, semantics, focus order and contrast.
Include motion duration, easing, entry/exit, interruption and reduced motion;
narrow/wide layouts, long/localized content, RTL, forced colors and 200% zoom.
Every non-applicable check needs a source-linked reason.

The workbook adds required native-contract checks to the existing acceptance
matrix. Passing earlier appearance checks cannot substitute for direct token
consumption, native defaults, compatibility direction or native consumer QA.
Do not blanket-set the acceptance matrix to Pass from a unit-test result.

Each task authors a focused verifier at `scripts/material3/verify/TASK_ID.mjs`.
It runs the actual tests and emits JSON with `strategyId`, `taskId`, `revision`,
`materialWebCommit`, `checks`, and `preview` when visual review applies. Each
policy requirement in `checks` has `result: "Pass"` and a nonempty `evidence`
array of repository-relative files. Tests and browser receipts must identify
the same revision. The task runner rejects missing requirements and missing
files. Task-specific verifiers own substantive assertions; the runner validates
the receipt and workflow, and is not itself a parity oracle.

Foundation receipts list the exact covered `tokenIds`. Component token scopes
contain comma-separated CSS prefixes (for example `--md-divider-`), without
prose. Native QA is recorded separately from historical approvals; verification
sets it to Pending, and only a new human decision can approve it.

Verification also requires the mapping's current Contract value and its complete
acceptance/token evidence. A task whose target is a component cannot close while
its mapping is missing native evidence. Human review follows automated evidence,
using the installed/built native entry point. Record the exact SHA, source pin,
preview URL and approval reference. Changed implementation requires affected
checks and human review again. Current-record PRs still require the repository's
exact-commit owner gate. Merge approved passing PRs and remove their worktrees
through the main migration task's established workflow.

## Preview and progress meaning

The docsite is the catalog for browsing the migration; Storybook provides
focused variants and interaction cases. Both must expose Material 3 and light/
dark selection, and distinguish a themed Core preview from a native verified
component. The docsite currently needs native package discovery and a selectable
preview theme; its existing neutral wrapper is not evidence of Material parity.

Closed legacy tasks remain historical accomplishments. Component and token
`Fully migrated?` formulas require the active native contract, complete evidence
and human approval. The summary may consequently show fewer fully migrated rows
after the pivot even though the historical work is preserved. Never reset the
source inventories, old QA records or source-linked test receipts to hide that
distinction.
