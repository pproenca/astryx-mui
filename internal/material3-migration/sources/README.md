# Material 3 source baseline work

This directory contains source evidence for `M3-SRC-001`. It is not a second
task database and does not itself mark any foundation or component as migrated.
The [migration guide](../../../docs/contributing/material3-migration.md)
remains the task authority.

## Pinned sources

| Source                                                                                                                     | Pin                                                                                                                                           | Use                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Material 3 Design Kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit) by Material Design | Supplied `.fig` export SHA256 `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`; export timestamp `2026-09-21T16:52:27.584Z` | Design gaps and Figma-only coverage; subject to Compose-first routing                         |
| [Material 3 guidance](https://m3.material.io/styles)                                                                       | Rendered pages observed 2026-09-26; individual page URLs below                                                                                | Fill kit gaps, especially interaction and motion                       |
| [Material Web](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3)          | Commit `cbd34a8921915af94d5ef65c2a69eece41d5b4f3` (2026-09-24)                                                                                | Web implementation and browser behavior, subject to source differences |

The kit's Figma Community page lists [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`figma-kit-inventory.json` is a derived inventory of IDs, names, variants,
variables, and style summaries. It does not include the `.fig` file or artwork.
`figma-foundation-values.json` retains values from the 30 active typography
styles and ten elevation effect styles. Forty-two soft-deleted typography style
nodes were excluded.
The workbook also retains these source inventories for task lookup.
[Foundation source reconciliation](reconciliation.md) records the measured
kit/Web differences and the resulting source route for the native graph.

### Compose reference

The owner approved Compose-first precedence and a source refresh on 26 September.
[Version evidence](source-versions.md) records the pins and comparison. Earlier
kit/Web reconciliation remains historical observation, not active precedence.

The frozen baseline also uses AndroidX commit
`a095da93f8e98dea8748ceed79ea8427aade245f`. The external shallow/sparse checkout is
read-only; `M3_ANDROIDX` locates it. `source prepare` validates the commit and clean
source paths, then reproduces `compose-inventory.json`. Policy pins its semantic
JSON hash. Every indexed family, token file, test and sample links to that commit.
The index includes candidate source families, not a claim of exhaustive API parsing
or parity. Source resolution must inspect variants, helpers and missed references.
Public API snapshots for every published module under `compose/material3`, including
adaptive layouts/navigation, ripple, window sizing and A2UI, are separately retained
as unresolved scope rows. `M3-SRC-002` must reconcile each API surface with mapped
design-system ownership or an approved platform/integration exclusion. This avoids
silently treating the main component artifact as the entire Compose codebase.

The derived index includes token expressions from **The Android Open Source
Project**, under [Apache License 2.0](LICENSE.androidx). Kotlin source remains in
the external reference checkout. Preserve upstream copyright/license headers and
any applicable notices for code translated into permanent product implementation.
The index and this migration-only license copy can be deleted with the harness;
permanent derived code must carry its own required attribution.

## Rendered kit references

These 1× PNGs were exported on 2026-09-26 from a Figma working copy of the
supplied kit. The selected node IDs, names, and dimensions match the supplied
`.fig` export. Material Design's kit is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/);
the images are reproduced here with attribution for source comparison.

| Reference                                                   | Kit node                           | PNG size    | SHA256                                                             | Interpretation                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------- | ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| [Color guidance](figma-exports/color-guidance.png)          | `55343:13516` (section)            | 2999 × 1546 | `e97017f32fd34bb0b4950f30a7284ce882e661465e3e0fdf629d1c84aec52766` | Complete tonal palettes and light/dark scheme diagrams; compare role bindings on the same surface and mode.          |
| [Typescale](figma-exports/typescale.png)                    | `58186:19244` (`typescale`)        | 1580 × 1440 | `4a2317c4fc44735c14377ad9f31e22039910ca95ed43aa2d630ab06bbdf89104` | Transparent group containing baseline and emphasized examples; compare over a specified surface, with Roboto loaded. |
| [Elevation](figma-exports/elevation.png)                    | `55343:13518` (`Untitled` section) | 1484 × 1243 | `31de0a4ffff8b5aeaff45b75c04276b47c4cb26f0ca6420de0f055d3079f53b6` | Light and dark five-level examples on their kit surfaces; compare at native scale and with the same backing surface. |
| [Corner radius scale](figma-exports/corner-radius.png)      | `58548:7181` (section)             | 1260 × 936  | `80dad82b71edd4adb1ff7434db19cda78be3af3a35fc75a58b29d577bceb7ac9` | Ten source examples, including increased sizes and a visibly full treatment.                                         |
| [Expressive shape set](figma-exports/expressive-shapes.png) | `58548:7234` (section)             | 3341 × 2929 | `3030eb51023a5c73d4664b3a55d5bd9bdadf4a54239ca883c667f66fa6f92a15` | The kit's 35 named shapes; source coverage does not imply a native shape implementation.                             |

The `material-theme` color group (`49823:12154`) exported with its light and
dark scheme diagrams absent, despite those diagrams appearing on the Figma
canvas. That PNG was discarded; the parent Color Guidance section above
contains the complete diagrams. These exports are
source observations, not matched Astryx scenario fixtures or migration proof.
The current Community working copy may differ from the frozen supplied `.fig`
export despite matching node IDs and dimensions; reconcile rendered values
before using a PNG as an exact expected image.

## Rendered Material guidance captures

The following focused notes were taken from rendered Material pages on
2026-09-26. Each records its exact URL, observed rule, scope, and remaining
verification limit. They supplement the pinned kit rather than overriding it.

| Dimension           | Guidance capture                               |
| ------------------- | ---------------------------------------------- |
| Color               | [Role use](guidance/color-roles.md)            |
| Typography          | [Fonts](guidance/typography-fonts.md)          |
| Shape               | [Shape system](guidance/shape.md)              |
| Spacing and density | [Spacing](guidance/spacing.md)                 |
| Elevation           | [Elevation](guidance/elevation.md)             |
| Icons               | [Material Symbols](guidance/icons.md)          |
| State layers        | [Interaction states](guidance/state-layers.md) |
| Motion              | [Motion physics](guidance/motion.md)           |

## Established coverage and differences

| Dimension           | Kit evidence                                                                                                                                                                                           | Difference or gap to resolve                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color               | `M3` collection `54778:406` has 197 variables and 32 modes, including light, dark, contrast and named schemes.                                                                                         | Pin representative role values in every required mode and compare the chosen scheme to Web.                                                                                                                                                                                                                                                                                                                                                                 |
| Typography          | `Typescale` `55064:15508` has 90 variables; the export has 30 `M3/` text styles, 15 of them emphasized.                                                                                                | [Material guidance](https://m3.material.io/styles/typography/overview) says 30 styles and marks Web Expressive unavailable. The pinned Web `tokens/_md-sys-typescale.scss` has no emphasized tokens. The kit governs the emphasized styles. Forty-five Typescale font/weight variables are unresolved external aliases in this extraction, so resolve them from style nodes or another explicit source.                                                     |
| Shape               | `Shape` `55064:15586` has 10 corner variables, including extra-extra-large and increased large sizes.                                                                                                  | Pinned Web `tokens/_md-sys-shape.scss` exposes a narrower corner set. Preserve kit roles rather than dropping the additional ones.                                                                                                                                                                                                                                                                                                                          |
| Elevation           | Ten published `M3/Elevation` effect styles, five each for light and dark, have exact node IDs and shadow values in the foundation values file. The kit's light/dark example section is captured above. | Match Astryx's rendered appearance under fixed size and surface against the source image; the export alone does not establish parity.                                                                                                                                                                                                                                                                                                                       |
| Icons               | The inventory identifies 21 icon-named component sets.                                                                                                                                                 | Select exact icon source, glyphs, optical sizes and font/version for native comparisons. A name match does not prove visual parity.                                                                                                                                                                                                                                                                                                                         |
| State layers        | The inventory includes 147 variables with `State` in their names and 294 styles with `State` in their names.                                                                                           | Resolve their bindings to component states and distinguish opacity from rendered appearance.                                                                                                                                                                                                                                                                                                                                                                |
| Spacing and density | No global variable or style is named spacing or density; five component sets explicitly mention density.                                                                                               | Measure the relevant kit nodes; use [Material guidance](https://m3.material.io/styles/spacing/overview) where the kit is silent.                                                                                                                                                                                                                                                                                                                            |
| Motion              | No collection, variable, style or component set is named motion or spring in the extracted inventory.                                                                                                  | [Material motion specs](https://m3.material.io/styles/motion/overview/specs) use spring composites, with Web curves for limited cases. Pinned Web `tokens/versions/v0_192/_md-sys-motion.scss` contains easing and duration values, not spring roles. Four official clips have been watched and sampled; [motion observations](motion/README.md) separate overshooting spatial/expressive travel from non-overshooting standard travel and opacity effects. |

These are inventory findings, not final source decisions. The next evidence pass
must resolve external aliases and component geometry, capture
rendered guidance by page, and choose matched light/dark and responsive scenarios.
`task verify M3-SRC-001` must remain blocked until its
source decision and baseline fixtures exist.
