# Material 3 source baseline work

This directory contains source evidence for `M3-SRC-001`. It is not a second
task database and does not itself mark any foundation or component as migrated.
The [migration guide](../../../docs/contributing/material3-migration.md)
remains the task authority.
The [versioned Compose-first source decision](baseline/README.md) selects the
eight foundation routes and 53 pinned source scenarios, including narrow and
RTL captures. Browser performance and trajectory tolerances still require
native measurement and human approval.

## Pinned sources

| Source                                                                                                                     | Pin                                                                                                                                           | Use                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Material 3 Design Kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit) by Material Design | Supplied `.fig` export SHA256 `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`; export timestamp `2026-09-21T16:52:27.584Z` | Design gaps and Figma-only coverage; subject to Compose-first routing  |
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
adaptive layouts/navigation, ripple, window sizing and A2UI, are separately retained.
The [full source coverage reconciliation](source-coverage-reconciliation.md)
records the native owners, public API helpers and two approved platform/integration
exclusions. This avoids silently treating the main component artifact as the
entire Compose codebase.

The derived index includes token expressions from **The Android Open Source
Project**, under [Apache License 2.0](LICENSE.androidx). Kotlin source remains in
the external reference checkout. Preserve upstream copyright/license headers and
any applicable notices for code translated into permanent product implementation.
The index and this migration-only license copy can be deleted with the harness;
permanent derived code must carry its own required attribution.

The [pinned Compose typography reference](compose-typography.md) records the
baseline and emphasized styles, family override behavior and the difference
between platform SansSerif and the kit's Roboto. The
[pinned Compose motion reference](compose-motion.md) records standard and
expressive spring schemes and upstream assertions. Matched glyph scenarios,
motion traces and native browser behavior remain to be verified.
The [typography reference](typography-reference/README.md) renders all 30
Compose type roles in light and dark at a pinned Chrome/Roboto environment;
it is source evidence, not a native component or Figma pixel match.
The [source color swatches](color-reference/README.md) are deterministic
fixtures for Compose baseline Light/Dark, Compose Expressive Light, and all 32
published kit modes. They do not substitute for a rendered native gallery.
The [corner reference](corner-reference/README.md) renders the ten kit-mapped
Compose corner roles in light and dark under recorded Chrome conditions. It
does not resolve the separate 35 Expressive polygon geometries.
The [state-layer reference](state-reference/README.md) captures Compose default
layer colors and a filled Button binding in light and dark. The
[spacing reference](spacing-reference/README.md) diagrams the pinned default
Button and TextField geometry in both modes. Neither capture establishes
native component acceptance.
The [icon reference](icon-reference/README.md) samples the Compose unsized
fallback, three pinned Material Symbols fonts and selected pinned SVG artwork
in light and dark. Its glyph choices are source examples, not global component
defaults.
The [Compose spring replay](motion/source-reference/README.md) visualizes the
independent default spatial traces at 50 fps and preserves aligned light/dark
source frames. It is not native motion acceptance.

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

The [Hexagon variant SVG](figma-exports/shape-hexagon.svg) and
[PNG](figma-exports/shape-hexagon.png) were exported at 1× from `Shape Set`
node `58548:7271` in the same working copy on 2026-09-26. Both are 380 × 380;
the PNG has an alpha channel and SHA256
`f90fcee6bf1c275ea913985d352d7c106d0590297ce55157691cdfbec20af852`.
The SVG has SHA256
`4395ebac155f2e28c98b01747ba5c7c8056bc29049f25dee925212fee1a837b4`.
The component property says `Hexagon`, while its displayed caption says
`Clamshell`; [reconciliation](reconciliation.md) keeps the Compose geometry
mapping open. Material Design's CC BY 4.0 attribution above also applies to
these exports. The PNG is a source fixture, not yet a matched native
light/dark scenario.

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

The [Compose elevation decision](compose-elevation.md) records its selected
tonal formula, separate shadow behavior, and the guidance conflict.

## Established coverage and differences

| Dimension           | Kit evidence                                                                                                                                                                                           | Difference or gap to resolve                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color               | `M3` collection `54778:406` has 197 variables and 32 modes, including light, dark, contrast and named schemes.                                                                                         | Compose's baseline Light differs from kit Light in four roles; its Expressive Light overrides those four but retains three measured differences. Dark matches. The kit/Web `Shadow` role fills the one missing scheme role. Pinned Compose does not define the kit's 30 fixed contrast and named mode maps, so their scenarios use the kit's complete role values; see [reconciliation](reconciliation.md). Matched rendered scenarios are still needed.    |
| Typography          | `Typescale` `55064:15508` has 90 variables; the export has 30 `M3/` text styles, 15 of them emphasized.                                                                                                | Compose supplies all 30 roles, with five tracking and five emphasized-weight disagreements against the kit; see [typography comparison](compose-typography.md). The kit's Roboto fills the browser comparison-font gap. Forty-five Typescale font/weight variables are unresolved external aliases in the extraction; resolve them from style nodes or another explicit source before using those aliases.                                                  |
| Shape               | `Shape` `55064:15586` has 10 corner variables, including extra-extra-large and increased large sizes.                                                                                                  | Compose has those increased values and uses `CircleShape` for Full. The kit's 1000px and Web's 9999px Full values are recorded disagreements, not native defaults. Compare expressive shape geometry before equating similarly named variants.                                                                                                                                                                                                              |
| Elevation           | Ten published `M3/Elevation` effect styles, five each for light and dark, have exact node IDs and shadow values in the foundation values file. The kit's light/dark example section is captured above. | Match Astryx's rendered appearance under fixed size and surface against the source image; the export alone does not establish parity.                                                                                                                                                                                                                                                                                                                       |
| Icons               | The inventory identifies 21 icon-named component sets.                                                                                                                                                 | The [Compose icon decision](compose-icons.md) resolves 24 dp unsized fallback, tint and semantics. [Source samples](icon-reference/README.md) pin three Material Symbols families and selected SVG artwork. Each native component still selects exact glyph, variant, axes and target size. A name match does not prove visual parity.                                                                                                                      |
| State layers        | The inventory includes 147 variables with `State` in their names and 294 styles with `State` in their names.                                                                                           | Compose defaults are dragged 0.16, focus 0.10, hover 0.08 and pressed 0.10. Pinned Web differs for focus and pressed (0.12). See [reconciliation](reconciliation.md) and the [source check](../tests/source-state.test.mjs); component bindings and rendered appearance remain open.                                                                                                                                                                        |
| Spacing and density | No global variable or style is named spacing or density; five component sets explicitly mention density.                                                                                               | The [Compose spacing decision](compose-spacing-density.md) resolves baseline and expressive small Button geometry, TextField defaults and the opt-in precision-pointer branch. Measure other component variants and kit gaps; use [Material guidance](https://m3.material.io/styles/spacing/overview) only for remaining gaps. Do not infer a universal spacing scale.                                                                                      |
| Motion              | No collection, variable, style or component set is named motion or spring in the extracted inventory.                                                                                                  | [Material motion specs](https://m3.material.io/styles/motion/overview/specs) use spring composites, with Web curves for limited cases. Pinned Web `tokens/versions/v0_192/_md-sys-motion.scss` contains easing and duration values, not spring roles. Four official clips have been watched and sampled; [motion observations](motion/README.md) separate overshooting spatial/expressive travel from non-overshooting standard travel and opacity effects. |

These findings support the active Compose-first routes in
[reconciliation](reconciliation.md); they do not certify individual component
decisions. The source-only M3-SRC-001 baseline is merged; native family decisions,
external aliases, component geometry and matched light/dark responsive scenarios
remain implementation prerequisites.
