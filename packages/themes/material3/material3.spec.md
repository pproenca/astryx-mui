---
schema_version: 2
template_version: 1
kind: theme
id: theme:material3
authority: current
approved_by: pproenca
approved_at: 2026-09-26
review_triggers:
  [tokens, palette-values, component-mappings, contrast, artifacts]
verified_by:
  [
    packages/themes/material3/src/material3Colors.test.ts,
    packages/themes/material3/src/material3Typography.test.ts,
    packages/themes/material3/src/material3Shape.test.ts,
    packages/themes/material3/src/material3Motion.test.ts,
    packages/themes/material3/scripts/check-spatial-browser.mjs,
    packages/themes/material3/src/material3Elevation.test.ts,
    packages/themes/material3/src/material3Icons.test.tsx,
    packages/themes/material3/src/MaterialSymbol.test.tsx,
    packages/themes/material3/src/MaterialBadge.test.tsx,
    packages/themes/material3/scripts/check-theme-parity.mjs,
  ]
package: '@astryxdesign/theme-material3'
source_theme: packages/themes/material3/src/material3Theme.ts
references:
  [
    architecture:theme-authoring-contract,
    architecture:theme-tokens,
    architecture:theme-compilation,
    architecture:component-theming-surface,
    spec:AST-006,
  ]
---

# Material 3 theme specification

This record owns the maintained Material 3 theme family. Existing current token,
theme-authoring, compiler, and component contracts continue to govern their
respective boundaries. This theme does not change Core token names, default
values, or the behavior of existing themes.

## Native direction and implementation status

Pinned AndroidX Compose Material 3 is the selected default authority for overlapping
anatomy, tokens, defaults, variants, states and motion. Figma supplies uncovered design
and Figma-only variants; captured Material guidance and watched media fill remaining
concerns. Material Web and native web standards govern browser semantics. Lower sources
fill evidenced gaps. Replacing a specified Compose value requires a dimension-specific,
source-backed human-approved exception. Export and checkout dates alone do not establish
freshness. Native acceptance still requires matched visual references, timed motion
evidence and foundation approval before component implementation expands.

Research is shared by component family, then variants/subcomponents and task slices.
Design precedence is Compose, Figma, captured guidance, then Web. Behavior/motion use
Compose, captured guidance/media, Figma, then Web. Resolve each concern and exception
once and reuse it. Source presence never creates duplicate migration owners or erases
single-platform coverage. Operational lessons cannot change this authority.

The migration targets the complete, dated Material 3 and Material 3 Expressive
baseline: the union of the selected Figma kit, Material guidance and pinned Compose
APIs, with explicit ownership for helpers and source-backed, human-approved platform
exclusions. Missing Web coverage is required migration work. A source match is a
candidate, not proof of equivalent variants or behavior. Source revisions are fixed
for a migration baseline; new upstream releases require an explicit scope update.

The active Compose reference is AndroidX
`a095da93f8e98dea8748ceed79ea8427aade245f` (26 September 2026), replacing
`b97c4470f19d8ae9bb9f96be24376fdf37ad056f` after an explicit source refresh. Experimental APIs and incomplete defaults
remain identified in source decisions. Compose expressions do not establish public
Material Web CSS properties. Native typed roles and supported customization are
owned here; source-only values retain explicit private names and attribution.

Native response means correct browser semantics, immediate input handling and
continuous motion under interruption/reversal, with reduced-motion alternatives.
Foundation QA establishes browser/device profiles and numeric response/frame-pacing
budgets. Applicable spring trajectories use independent upstream recordings with
matched inputs, units, velocity and settling criteria. Numeric checks complement
watched media and visual comparisons; Android rasterization is not an exact browser
pixel baseline. Nonzero visual tolerances still need explicit human approval.

Public contracts, component docs, necessary assets, attribution and regression
fixtures/tests survive the migration. No product runtime, build or permanent test
may depend on the temporary harness or its caches. Final acceptance requires the
complete native inventory and an isolated build/test run with that harness absent.

The family target is a native Material 3 component system under
`@astryxdesign/material3` (`packages/material3`). That package is planned work;
the presently shipped workspace implementation remains the additive
`@astryxdesign/theme-material3` bridge and its initial component integrations.
This record owns the family token and compatibility direction. Each native
component's direct record owns its anatomy, defaults, states and public API.

Native styling consumes supported Material component and system token names
directly. Core portable tokens remain the compatibility contract for Core
consumers; they are not an intermediate vocabulary required by native Material
components. Reuse existing low-level behavior only when its semantics match the
Material component. A conflicting Core component is a candidate for a separate
native implementation, not a reason to compromise the Material contract.

The target dependency direction is canonical Material values and roles, native
component recipes, then optional legacy adapters. Native implementations must
work without the Core theme bridge and its token declarations. Legacy aliases
reference the canonical roles and must respond to scoped system/component
overrides; independent copies of resolved values are transitional debt. Native
typed helpers resolve the same graph as runtime and compiled CSS. This does not
add Material names to Core's portable TokenName or change its token helpers.

Existing source fixtures and human QA remain evidence of the implementation and
contract they tested. Native conformance requires a new verification revision,
native entry-point preview, and human QA after any behavior or appearance change.
The [migration guide](../../../docs/contributing/material3-migration.md) and
[verification policy](../../../internal/material3-migration/policy.json)
project this boundary; the migration workbook alone owns tasks and dependencies.

## Intent and audience

The Material 3 theme gives Astryx builders a coherent light and dark Material 3
foundation. Its roles are traced to the pinned Material Web source and checked
against rendered components. The source snapshot is
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
whose active Sass wrappers use the `v0_192` token source. That Web/Figma
comparison describes the existing Core compatibility theme. Native Material 3
source decisions use the Compose-first rule above; Figma fills evidenced design
gaps and retains Figma-only scope.

## Inheritance and base

The current compatibility package defines a standalone `material3Theme` from Astryx Core defaults.
It will not extend Neutral: Neutral's palette, type, motion, and mappings are a
different theme-family decision. `defineTheme` remains the authoring API. The
same normalized theme must drive runtime injection and the built CSS/JS pair.

The source package now builds through `astryx theme build` and `tsup`. It emits
`source`, `built`, and `theme.css` entry points with 97 portable overrides and
181 theme-local roles. A parity check compares source and built token maps,
checks each emitted local declaration, and resolves all 49 system colors in
light and dark Chrome contexts. Component overrides still follow their own
migration stories.

## Portable token overrides

Existing `tokens` names remain the portable Core contract. The Material 3 theme
may override a portable token only where its role has a defensible semantic
match. A mapping receipt records the Material role, Astryx role, source value,
light and dark modes, and rendered consumer. Similar spelling is insufficient.
Several Material roles can contribute to one portable role only when the
resulting use has the same meaning across every Core consumer. Other Material
roles stay in the theme family. The compatibility package uses them through
component overrides; native implementations consume them directly.

No Material role is added to `TokenName`, `tokenVar`, generated portable token
docs, or Core defaults merely to make this theme work. Spacing and control size
retain Astryx's portable vocabulary for Core consumers. Native component geometry
follows the resolved Compose-first component design without translation through a Core
size or spacing scale.

The pinned Material Web checkout has no system spacing, size, or density Sass
wrapper. `material3SpatialSource.json` instead captures 95 geometry values
from 10 active component wrappers, with their supported CSS property status.
Examples include a 40px filled-button container, a 40px icon-button state
layer, 56px and 72px list rows, and a 52px by 32px switch track with a 48px
touch target. The extractor checks the pinned Sass values and a Chrome
reference fixture checks representative dimensions and logical padding in LTR
and RTL. These source values are component-mapping inputs, not a new universal
spacing or density scale. Astryx's `--spacing-*`, `--size-element-*`, and
existing density props remain portable. Each component migration must decide
how its sizes, content, focus and touch target map to the relevant Material
component geometry and prove the actual rendered result.

## Theme-local role definitions

The theme enrolls CSS-backed Material roles through `localTokens`. For roles
that Material Web's active wrapper exposes as CSS custom properties, the exact
`--md-ref-typeface-*`, `--md-sys-color-*`, `--md-sys-typescale-*`, and supported
`--md-sys-shape-*` spellings provide traceable Material names. These names are
public within the Material 3 family under AST-006. Core components continue to
use portable tokens; the compatibility theme's rules may reference enrolled
names, and native Material components consume those roles directly.
Each enrolled role needs an exact source row and a
light/dark value or a source-backed mode-independent value.

Material Web's pinned [theming guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/theming/README.md)
explicitly excludes `--md-ref-palette-*` and `--md-sys-motion-*` as CSS token
APIs. `md-item` likewise has no `--md-item-*` CSS properties in its
[wrapper source](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/tokens/_md-comp-item.scss).
Palette stops and elevation levels remain source-backed implementation values.
Motion values, state opacities, and generated typography tracking are emitted
only under `--astryx-theme-material3-*` names, so component rules can consume
them without implying a Material Web CSS property. They are not advertised as
Material Web CSS parity.

The workbook's `Material access` and `Token mapping` sheets classify the pinned
Sass list, evaluated `values()` keys, generated-only roles, and public CSS
exposure separately. A `Confirmed` mapping requires source, implementation,
focused verification, and review evidence; an inventoried name alone is not
parity.

The pinned typography source supplies five reference typeface values and 62
active size-specific typescale values. Its generated source also contains 15
tracking values that the active Material Web typescale wrapper excludes. The
theme may use those tracking values in Astryx's own component typography, but
must not label them as Material Web CSS custom properties. Roboto at weights
400, 500, and 700 is the source typeface; the theme supplies an Arial/system
fallback and consumer docs must state that loading Roboto is needed for exact
glyph metrics. A focused Chrome check covers computed size, line height,
weight, spacing, family fallback, and line box for all 15 size-specific roles.
Rendered glyph comparison with Roboto loaded remains part of foundation QA.

The pinned shape wrapper exposes seven single-corner CSS roles. Five additional
multi-corner names are Sass-only lists, not settable `--md-sys-shape-*` custom
properties. `material3Shape.ts` keeps those lists separate and mirrors the
directional start/end forms in RTL. A Chrome check covers computed geometry for
all seven CSS roles and both directions of the five Sass lists. Component
shapes remain the responsibility of their component mappings.

The pinned motion and state wrappers supply 16 duration values, 10 easing
curves, and four state-layer opacities through Sass `values()` only. The
generated motion `path` value is null and remains unsupported. The theme keeps
these values as implementation data, and its state-layer helper composes the
state opacity with the foreground color over the current surface. A focused
Chrome check covers every value and a CSS reduced-motion override that stops
transition travel while retaining state-layer feedback. Component-specific
motion and the current pressed-overlay behavior remain with their owners;
individual component migration receipts must prove their reduced-motion states.

The active Material Web elevation wrapper normalizes six levels to web values
0–5; its generated source still carries dp values 0, 1, 3, 6, 8, and 12.
`material3ElevationSource.json` records both series and extracts the rendered
key and ambient shadows separately from pinned Sass in Chrome. Their opacities
are 0.3 and 0.15. `material3ElevationLayers` substitutes the theme's shadow
color while retaining both layers; it must not be flattened into one opaque
`box-shadow`. The `--md-elevation-level` and `--md-elevation-shadow-color`
properties belong to Material Web's elevation component, not system CSS roles.
Tonal surface-container colors are separate from the shadow level; each
component mapping must choose its surface, layer order, overflow behavior, and
high-contrast boundary. A Chrome check covers all six levels over both pinned
light and dark surface-container-low colors.

The portable `--shadow-low`/`med`/`high` bridge combines key and ambient
shadows in one CSS `box-shadow` value for current Core consumers. That bridge
does not exactly reproduce Material Web's two translucent pseudo-elements
where the shadows overlap. Source-faithful components must use the separate
`material3ElevationLayers` values during their own migration.

The icon source is Google's official Material Symbols SVG repository at commit
`bd8cb85bd4bad964fe6918f79665bb40c3a8efef`, licensed Apache-2.0.
`material3IconSource.json` pins one 24px Outlined SVG per released Astryx shared
icon meaning, with filled artwork for success, error, warning, and info.
`material3IconRegistry` supplies all 28 through the existing theme-scoped
`icons` resolver. The theme sets `iconDefaultSize: 'lg'` so an unsized
standalone Icon follows Material Web's 24px default. Explicit `size="md"`
remains 20px and nearer component-owned slot defaults still win. Artwork
scales to the existing Icon `xsm`/`sm`/`md`/`lg`
sizes (12/16/20/24px equivalents at a 16px root) and inherits current color;
it requires no icon font request. Material Web's icon default is 24px, while
its filled Button uses an 18px icon and its icon button uses 24px. Those
component-specific slot sizes and operable targets are owned by their
component migrations; this theme does not change Core Icon size values or
semantic icon names. A Chrome contact sheet verifies visible glyph geometry,
and component QA must review meaning, size, direction, contrast, and targets.

For the separate font channel, `MaterialSymbol` is an opt-in export from
`@astryxdesign/theme-material3/MaterialSymbol` with a matching
`material-symbol.css` export. It accepts one ligature or Unicode codepoint,
Outlined/Rounded/Sharp families, an exact pixel size, and Material Symbols
FILL, wght, GRAD, and opsz axes. The default size resolves
`--md-icon-size` then 24px; `--md-icon-font` can override the font family.
Its consumer loads the selected font family and glyph coverage. Astryx does
not redistribute a Material Symbols font binary. A standalone meaningful
symbol uses `label` for an accessible image name; decoration is hidden from
assistive technology. This channel does not add arbitrary font glyph names
to Core `Icon` or change its semantic SVG resolution or size scale. The
source is the pinned Material Web [icon documentation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/icon.md)
and [implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/icon/internal/_icon.scss).

## Tonal palette definitions

The pinned `v0_192` baseline contains 91 named reference palette values and
49 system color roles in each of light and dark. The baseline primary tone 40
is `#6750a4`. `src/material3ColorSource.json` records those values, each role's
palette key, and the independently compiled Sass result for both modes.
`scripts/generate-color-source.mjs --check` reproduces the artifact from the
pinned checkout; the focused color test checks every resolved role and
representative text contrast pairings. The source and attribution are listed in
`THIRD_PARTY_NOTICES.md`.

This is the pinned baseline palette, not a claim that an arbitrary seed can
generate an equivalent dynamic scheme. Any generated scheme must be
deterministic and recorded with its input and source revision. Palette data is
an implementation input, not a public CSS API claim. The 49 roles include
fixed, surface-container, inverse, outline, error, and scrim roles.

## Component and state mappings

Foundation stories close before the first component story. Component overrides
will map supported Material variants and their hover, focus, pressed, selected,
disabled, loading, and error states to the theme roles. The component owner
retains semantic, keyboard, and accessibility behavior. For each migrated
component, the workbook must link the exact Material variant and source,
implementation, tests, and an interactive preview at the verified code revision.
Material Web Labs elements and Figma-only patterns remain explicitly labeled;
they do not silently become stable component parity claims.

The Divider mapping uses the pinned Material Web `--md-divider-color` role
(outline-variant), `--md-divider-thickness` (1px), and 16px logical insets.
Core `Divider` accepts optional `inset` and `isDecorative` props. The Material 3
theme supplies the component values; Core keeps its existing semantic default,
strong variant, labels, vertical orientation, and full-bleed behavior. The
source is the pinned [divider guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/divider.md)
and [Sass implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/divider/internal/_divider.scss).

The pinned Material Web badge is a Labs component, not a stable component.
Its 6px small badge is a visual dot; a value uses a 16px minimum pill with
label-small type. The `--md-badge-*` roles use error/on-error colors, full
corners, and the pinned generated size and type values. The newer Labs utility
classes keep the same surface geometry and leave anchoring to the caller.
`MaterialBadge` is a separate opt-in export with an accompanying stylesheet;
Core `Badge` keeps its standalone status and category label semantics. The
new component renders a presentational badge surface and the consumer owns its
placement over an icon, button, or other target. An unnamed badge is hidden
from assistive technology; an optional label names a meaningful standalone
badge. When the badge augments a control, that control's accessible name must
include the notification state. The source is the pinned
[Labs implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/labs/badge/internal/_badge.scss),
[generated token values](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/tokens/versions/v0_192/_md-comp-badge.scss),
and [Labs utility classes](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/labs/gb/components/badge/badge.scss).

## Compatibility and migration

The Core compatibility theme is additive. Existing released Core token names, defaults, helpers,
other theme packages, and consumer imports remain valid. The new package follows
the established source, built, and stylesheet entry points. A later decision to
make any Material role portable or change a Core default must go through its
current architecture and compatibility owners with representative browser
evidence.

The native package uses Material names and defaults without a permanent Core
token bridge. Remove compatibility exports only after an inventory of affected
consumers, replacement imports/codemods, deprecation criteria and an explicit
major-release decision. Preserve the separate supported Core surface until that
decision. Retain Meta and Google attribution and all applicable license notices.

## Accessibility and contrast evidence

The color story must measure representative content, icon, control, and state
pairings in light, dark, and high-contrast contexts. Foundation QA must inspect
reduced motion and responsive layout as well as contrast. The current design
and component records set shared requirements; the foundation QA receipt records
measured pairings, and each component story records its own exceptions and gaps.

## Build and artifact contract

The package exports a source theme, a complete built theme, and matching
CSS using the same pattern as maintained Astryx themes. Runtime and static
outputs must resolve the same values for each mode. Source revision and build
receipts must identify the pinned Material Web input and Astryx code revision.

## Verification map

| Theme contract          | Evidence                                                  | Representative states                      | Failure signal                                                 |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Source-role inventory   | Pinned workbook mapping and Sass wrapper audit            | CSS-backed, Sass-only, generated-only      | A role is called public CSS from a Sass list alone             |
| Additive token boundary | Core token and theme tests; package type check            | Existing themes and Material 3             | Core vocabulary or defaults change without a separate decision |
| Light/dark foundations  | Color, type, shape, motion, state, and elevation receipts | Light, dark, high contrast, reduced motion | Source or resolved role drift                                  |
| Runtime/build parity    | Theme compiler test and browser inspection                | Source and built imports                   | Different resolved tokens or CSS                               |
| Component migration     | Focused tests and interactive QA receipt per component    | Variants, states, sizes, responsive modes  | A component closes without review at the verified revision     |

## Decision log

- 2026-09-25: The project owner chose a maintained Material 3 theme while
  preserving the released Core token vocabulary. This record fixes that
  additive theme boundary; component parity remains a separate decision.
- 2026-09-26: The project owner selected native Material token and component
  contracts as the migration destination. The earlier additive decision remains
  the compatibility boundary for released Core consumers. Native implementations
  use the family roles directly; foundation and completed component evidence
  require native revalidation before wider migration continues. The existing
  migration workbook remains the sole execution database.

- 2026-09-26 (superseded below): The project owner specified that Figma wins source disagreements.
  Website guidance and observed animation media fill gaps; Web source is implementation
  evidence. Foundation approval precedes shared Web/Figma component migration.

- 2026-09-26: The project owner approved Compose-first precedence and refreshing the
  Compose reference to the latest source. This supersedes the earlier Figma-first
  decision. Figma-only scope, documented fallbacks, approved exceptions and native
  browser semantics remain required. Existing source preparations and approvals
  must be revalidated under the v4 contract.

## Open questions

No open question blocks this foundation contract. The following decisions belong
to later, separately reviewed work:

- Arbitrary-seed dynamic color generation is outside this baseline theme. A
  separate decision and source-backed algorithm are required to add it.
- Each component story must review its own use of source-only motion, state,
  geometry, and elevation values, plus its rendered mapping, before claiming
  Material 3 component parity. Generated Sass does not imply CSS exposure.

## Content boundary

This record owns the Material 3 theme's intent, source snapshot, selected
palette and token mappings, required states and pairings, compatibility,
artifacts, and evidence. Current architecture records own cross-theme APIs and
portable token names. Component and family records own observable component
behavior. Consumer docs own usage syntax and examples.
