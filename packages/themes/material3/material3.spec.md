---
schema_version: 2
template_version: 1
kind: theme
id: theme:material3
authority: draft
approved_by: null
approved_at: null
review_triggers:
  [tokens, palette-values, component-mappings, contrast, artifacts]
verified_by:
  [
    packages/themes/material3/src/material3Colors.test.ts,
    packages/themes/material3/src/material3Typography.test.ts,
    packages/themes/material3/src/material3Shape.test.ts,
    packages/themes/material3/src/material3Theme.test.ts,
  ]
package: '@astryxdesign/theme-material3'
source_theme: packages/themes/material3/src/material3Theme.ts
references:
  [
    architecture:theme-authoring-contract,
    architecture:theme-tokens,
    architecture:theme-compilation,
    architecture:component-theming-surface,
    design:color-emphasis,
    spec:AST-006,
  ]
---

# Material 3 theme specification

This draft owns one proposed maintained theme family. Existing current token,
theme-authoring, compiler, and component contracts remain the authority while
this theme is built and reviewed. It does not change Core token names, default
values, or the behavior of existing themes.

## Intent and audience

The Material 3 theme gives Astryx builders a coherent light and dark Material 3
foundation. Its roles are traced to the pinned Material Web source and checked
against rendered components. The source snapshot is
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
whose active Sass wrappers use the `v0_192` token source. The community Figma
kit is supporting design evidence, not an implementation oracle.

## Inheritance and base

The package will define a standalone `material3Theme` from Astryx Core defaults.
It will not extend Neutral: Neutral's palette, type, motion, and mappings are a
different theme-family decision. `defineTheme` remains the authoring API. The
same normalized theme must drive runtime injection and the built CSS/JS pair.

## Portable token overrides

Existing `tokens` names remain the portable Core contract. The Material 3 theme
may override a portable token only where its role has a defensible semantic
match. A mapping receipt records the Material role, Astryx role, source value,
light and dark modes, and rendered consumer. Similar spelling is insufficient.
Several Material roles can contribute to one portable role only when the
resulting use has the same meaning across every Core consumer. Other Material
roles stay in the theme family and are used through component overrides.

No Material role is added to `TokenName`, `tokenVar`, generated portable token
docs, or Core defaults merely to make this theme work. Spacing and control size
retain Astryx's portable vocabulary; Material-specific geometry belongs in the
theme's component mappings until a separate shared Core decision is approved.

## Theme-local role definitions

The theme will enroll CSS-backed Material roles through `localTokens`. For roles
that Material Web's active wrapper exposes as CSS custom properties, the exact
`--md-ref-typeface-*`, `--md-sys-color-*`, `--md-sys-typescale-*`, and supported
`--md-sys-shape-*` spellings provide traceable Material names. These names are
public only within the Material 3 theme family under AST-006; Core components
continue to use portable tokens, while this theme's component rules may refer
to its enrolled names. Each enrolled role needs an exact source row and a
light/dark value or a source-backed mode-independent value.

Material Web's pinned [theming guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/theming/README.md)
explicitly excludes `--md-ref-palette-*` and `--md-sys-motion-*` as CSS token
APIs. `md-item` likewise has no `--md-item-*` CSS properties in its
[wrapper source](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/tokens/_md-comp-item.scss).
Palette stops, motion values, elevation levels, state opacities, and generated
typography tracking therefore remain source-backed theme implementation values
until a specific emitted CSS role is justified and named as an Astryx-owned
theme-local property. They are not advertised as Material Web CSS parity.

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

## Compatibility and migration

This theme is additive. Existing released Core token names, defaults, helpers,
other theme packages, and consumer imports remain valid. The new package follows
the established source, built, and stylesheet entry points. A later decision to
make any Material role portable or change a Core default must go through its
current architecture and compatibility owners with representative browser
evidence.

## Accessibility and contrast evidence

The color story must measure representative content, icon, control, and state
pairings in light, dark, and high-contrast contexts. Foundation QA must inspect
reduced motion and responsive layout as well as contrast. The current design
and component records set shared requirements; this theme will record its exact
pairings, exceptions, measured receipts, and known gaps as implementation lands.

## Build and artifact contract

The package will export a source theme, a complete built theme, and matching
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
  preserving the released Core token vocabulary. This draft records the
  proposed implementation boundary; it is not an approved theme record.

## Open questions

- Decide whether this theme supports arbitrary-seed dynamic color generation;
  the pinned baseline alone does not establish that algorithm's parity.
- Resolve each source-only motion, state, elevation, and tracking role when its
  foundation story lands; do not infer CSS exposure from generated Sass.
- Review exact component mappings and rendered evidence before promoting this
  record to `current` under the repository's owner-review rule.

## Content boundary

This record owns the Material 3 theme's intent, source snapshot, selected
palette and token mappings, required states and pairings, compatibility,
artifacts, and evidence. Current architecture records own cross-theme APIs and
portable token names. Component and family records own observable component
behavior. Consumer docs own usage syntax and examples.
