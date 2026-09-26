# Foundation source reconciliation

This is evidence for workbook task `M3-SRC-001`, not a migration status. The
[supplied kit inventory](figma-kit-inventory.json) and
[exact style values](figma-foundation-values.json) come from the pinned `.fig`
export. The comparison implementation is the pinned
[Material Web commit](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
represented by the checked-in `material3*Source.json` files in
`packages/themes/material3/src/`. The kit governs design values where it
specifies them. The website fills gaps; Material Web informs web behavior.

## Color

The kit's published `M3` collection (`54778:406`) provides 49 `Schemes/`
roles in each of 32 modes. Comparing its default Light and Dark values with
Material Web's 49 resolved roles per mode, after normalizing hex case and
three-digit hex notation, gives four Light differences and no Dark differences:

| Role                     | Kit Light | Web Light |
| ------------------------ | --------- | --------- |
| `on-error-container`     | `#852221` | `#410E0B` |
| `on-primary-container`   | `#4F378A` | `#21005D` |
| `on-secondary-container` | `#4A4459` | `#1D192B` |
| `on-tertiary-container`  | `#633B48` | `#31111D` |

Pinned Compose
[`ColorLightTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/b97c4470f19d8ae9bb9f96be24376fdf37ad056f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ColorLightTokens.kt)
also selects the corresponding palette tone 10 for all four roles. Its
[`PaletteTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/b97c4470f19d8ae9bb9f96be24376fdf37ad056f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/PaletteTokens.kt)
resolves those four values to the Web Light column above. The Figma export
therefore disagrees with both pinned implementations for these exact bindings;
do not substitute a nearby palette tone for the kit's published role value.

The native graph must use the kit's values for these roles. The current
Material Web-derived compatibility theme remains historical implementation
evidence, not the native source decision. The 30 kit contrast and named-scheme
modes have no matching resolved mode map in that Web fixture; retain their kit
values rather than inferring them from Light/Dark. Derived state-layer colors
must follow their chosen scheme roles. The complete
[kit color guidance export](figma-exports/color-guidance.png) supplies light and
dark diagrams. It is a source image, not yet a matched native scenario; rendered
parity still needs comparison at the same size, surface, mode, and font.

## Typography and fonts

All 15 baseline kit styles match the Web fixture's active family, size, line
height, and weight values, plus its generated-only tracking values, when `rem`
is evaluated at 16px. Tracking is not a public Web typescale CSS role. The kit adds 15
`-emphasized` styles with the same size, line height, and tracking as their
baseline partners. Their weights are Medium (500), except labels and
medium/small titles, which are SemiBold (600). Web's prominent label weight
700 is a different role and is not a substitute for the kit's emphasized
styles. All 30 active kit styles name Roboto. Pinned Compose supplies
[30 typography roles and override behavior](compose-typography.md) but names
platform SansSerif as its default family; the kit's explicit Roboto choice
governs the browser baseline. Use the pinned
[font fixtures](fonts/README.md) and [typescale export](figma-exports/typescale.png)
for a matched rendering scenario; matching numeric metrics does not prove
matching glyph pixels.

## Shape and elevation

Six shared corner values match exactly: none 0, extra-small 4, small 8,
medium 12, large 16, and extra-large 28px. The kit additionally specifies
large-increased 20px, extra-large-increased 32px, and extra-extra-large 48px.
Its Full value is 1000px, whereas Web's `corner-full` is 9999px. Keep the kit
value in the native graph; ordinary small components can look identical under
either radius, but the public token values differ. The kit's
[rendered corner scale](figma-exports/corner-radius.png) labels Full as `50%`;
record that usage distinction instead of assuming the numeric variable and
display example are identical CSS values. The separate
[35-shape set](figma-exports/expressive-shapes.png) is additional Expressive
geometry beyond the ten corner variables and needs its own native coverage.
The frozen kit inventory's `Shape Set` variants (`58548:7248`) include
`Hexagon` but no `Clamshell`; the rendered working-copy export labels the
rounded six-sided example `Clamshell`. Pinned Compose
[`MaterialShapes.kt`](https://android.googlesource.com/platform/frameworks/support/+/b97c4470f19d8ae9bb9f96be24376fdf37ad056f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt)
exports `ClamShell` but no `Hexagon`. This could reflect a naming or revision
difference between the frozen kit and its working copy. Resolve the exact
variant node and geometry before mapping either name; matching the count of 35
does not prove shape parity.

The kit has five light and five dark elevation effect styles. Each style's two
shadow geometries and alpha values agree with the corresponding Web level 1–5
layers after ignoring list order. The light level 1 and 2 effect lists reverse
the Web key/ambient order. Material Web paints separate translucent layers,
while the kit effect is a two-shadow Figma style. The same numbers therefore do
not prove the same pixels. Compare actual native shadows against the
[kit's exported light/dark example](figma-exports/elevation.png) on matched
surfaces and dimensions before choosing the rendering method.

## Other foundation routes

| Dimension           | Chosen design source for the next baseline                                                                                   | Remaining evidence                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icons               | Kit nodes where specified; official Material Symbols source for glyphs and axes absent from the kit                          | Pair exact glyphs, optical sizes, and states with kit nodes.                                                                                                                                                                                       |
| State layers        | Kit variables and applied component styles                                                                                   | Trace each state binding and rendered compositing.                                                                                                                                                                                                 |
| Spacing and density | Kit component geometry where specified; [Material spacing guidance](https://m3.material.io/styles/spacing/overview) for gaps | Measure representative nodes and responsive cases.                                                                                                                                                                                                 |
| Motion              | [Pinned Compose motion schemes](compose-motion.md); the extracted kit has no motion/spring collection                        | Select scheme, speed, spatial/effects kind and matched upstream traces. Use [observed media](motion/README.md) and [rendered guidance](guidance/motion.md) for visual intent; verify interruption, reversal and reduced motion in native behavior. |

The source task remains open. Exact per-dimension source decisions, captured
guidance, and light/dark scenario fixtures still need to be assembled for the
verification contract in `internal/material3-migration/README.md`.
