# Foundation source reconciliation

**Compose-first v4 source comparison.** The measured kit/Web values below remain
source evidence. The selected native route follows the pinned Compose source for
overlapping values. Figma supplies evidenced design gaps and Figma-only scope;
Material Web supplies browser implementation details. None of these observations
alone establishes a matched visual baseline or completed migration.

This is evidence for workbook task `M3-SRC-001`, not a migration status. The
[supplied kit inventory](figma-kit-inventory.json) and
[exact style values](figma-foundation-values.json) come from the pinned `.fig`
export. The comparison implementation is the pinned
[Material Web commit](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
represented by the checked-in `material3*Source.json` files in
`packages/themes/material3/src/`. The pinned AndroidX source at
`a095da93f8e98dea8748ceed79ea8427aade245f` is the first source for design,
defaults, behavior and motion. The website fills documented gaps.

| Foundation concern  | Selected route                                                     | Evidence and boundary                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color               | Compose baseline light/dark bindings and Expressive light override | `ColorLightTokens.kt`, `ColorDarkTokens.kt`, `PaletteTokens.kt`, and `ColorScheme.kt` define 48 scheme roles per mode. Expressive Light changes the same four roles as the kit, but three values still differ. The kit/Web `Shadow` role fills the one missing system-color gap. Kit contrast and named modes use their own fixed Figma maps. |
| Typography          | Compose's 30 role metrics and override behavior                    | [`compose-typography.md`](compose-typography.md); kit Roboto is the browser comparison fixture because Compose names only platform SansSerif.                                                                                                                                                                                                 |
| Shape               | Compose corner shapes and `MaterialShapes.kt`                      | The kit's 35-shape set supplies comparison nodes; name similarity alone does not establish matching geometry.                                                                                                                                                                                                                                 |
| Spacing and density | Compose component geometry                                         | There is no resolved universal spacing scale in these sources. The kit and captured guidance fill documented component or responsive gaps.                                                                                                                                                                                                    |
| Elevation           | Compose level and component surface/elevation selection            | `ElevationTokens.kt` gives levels 0–5 at 0, 1, 3, 6, 8, 12 dp. Web shadow CSS and kit effects are browser rendering references.                                                                                                                                                                                                               |
| Icons               | Compose `Icon` sizing/tint behavior where applicable               | The kit supplies specified glyphs; pinned Material Symbols artwork fills glyph gaps. Browser semantics and meaningful names remain component decisions.                                                                                                                                                                                       |
| State layers        | Compose component interaction and ripple behavior                  | Kit state styles and rendered guidance help with unspecified presentation; a global opacity list cannot replace per-component behavior.                                                                                                                                                                                                       |
| Motion              | Compose standard/expressive spatial and effects spring schemes     | [`compose-motion.md`](compose-motion.md) records spring inputs. [Watched media](motion/README.md) shows visual intent; Web curves are limited non-interruptible fallbacks.                                                                                                                                                                    |

This routing selects authority, not a fabricated implementation value. A family
decision must resolve any component-specific gap and its sibling variants before
that family is implemented. Native foundation QA still needs matched light/dark
reference captures, fonts, environments, and motion traces.

## Color

The kit's published `M3` collection (`54778:406`) provides 49 `Schemes/`
roles in each of 32 modes. Comparing its default Light and Dark values with
Material Web's 49 resolved roles per mode, after normalizing hex case and
three-digit hex notation, gives four Light differences and no Dark differences.
Pinned Compose has two distinct light defaults: baseline `lightColorScheme()`
uses the Web values below, while `expressiveLightColorScheme()` overrides
exactly those four roles. It agrees with the kit for one of them; the other
three remain measured differences. The dark default agrees across all three
sources.

| Role                     | Compose baseline / Web Light | Compose Expressive Light | Kit Light |
| ------------------------ | ---------------------------- | ------------------------ | --------- |
| `on-error-container`     | `#410E0B`                    | `#8C1D18`                | `#852221` |
| `on-primary-container`   | `#21005D`                    | `#4F378B`                | `#4F378A` |
| `on-secondary-container` | `#1D192B`                    | `#4A4458`                | `#4A4459` |
| `on-tertiary-container`  | `#31111D`                    | `#633B48`                | `#633B48` |

The refreshed pinned Compose
[`ColorLightTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ColorLightTokens.kt)
binds all four baseline roles to palette tone 10. Its
[`PaletteTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/PaletteTokens.kt)
resolves them to the baseline column above. The same pinned
[`ColorScheme.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ColorScheme.kt)
defines `expressiveLightColorScheme()` by overriding those four roles with
palette tone 30. `MaterialExpressiveTheme` uses that scheme when no color
scheme is supplied. Native baseline and Expressive variants must therefore
retain separate light values. The remaining three kit differences do not
override Compose's explicit Expressive values without a color-specific
approved exception. The
[`ColorDarkTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ColorDarkTokens.kt)
bindings agree with the kit's measured default Dark scheme. The current
Material Web-derived compatibility theme remains historical implementation
evidence, not the native source decision. For the kit's 30 contrast and named
color modes, the pinned `ColorScheme.kt` exposes customizable schemes but does not pin
those 30 named or contrast role maps. Its Android dynamic schemes read platform
colors, not these fixed kit maps. Select the kit's 30 complete, 49-role mode
maps for their own Figma-specified scenarios; do not substitute them for the
baseline or Expressive defaults. The focused source check confirms that every
kit role has all 32 mode values. Derived state-layer colors follow the selected
scheme roles.
Both Compose light and dark token files have 48 bindings. Of the kit's 49
`Schemes/` roles, only `Shadow` lacks a corresponding Compose color token.
The kit specifies `#000000` for `Shadow` in all its modes and pinned Material
Web resolves `shadow` to black in light and dark. Use that kit value for the
missing native system-color role; this is a documented gap fill, not an
exception to a specified Compose value. The focused
[`source-color.test.mjs`](../tests/source-color.test.mjs) recomputes the
baseline Light, Expressive Light and Dark comparisons from the pinned
inventories and [derived override map](compose-expressive-color.json). The
[`color-reference`](color-reference/README.md) fixtures render the selected
49 solid role values in each variant without borrowing values from the native
implementation; component color and state-layer comparisons remain separate.
The complete
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
[30 typography roles and override behavior](compose-typography.md), including
the emphasized styles, and names platform SansSerif as its default family.
Five tracking values and five emphasized weights differ from the kit's 30
styles. The native baseline selects Compose for those metrics; the earlier
kit/Web match does not establish a Compose match.
The kit's explicit Roboto choice fills the reproducible browser-font gap for
matched comparison; it does not override Compose's metrics or force a different
native default. Use the pinned
[font fixtures](fonts/README.md) and [typescale export](figma-exports/typescale.png)
for a matched rendering scenario; matching numeric metrics does not prove
matching glyph pixels. The
[source typography captures](typography-reference/README.md) render the 30
Compose metric sets in recorded light/dark Chrome conditions with pinned
Roboto; they remain separate from Figma and native-product comparisons.

## Shape and elevation

Six shared corner values match exactly: none 0, extra-small 4, small 8,
medium 12, large 16, and extra-large 28px. The kit additionally specifies
large-increased 20px, extra-large-increased 32px, and extra-extra-large 48px.
Its Full value is 1000px, whereas Web's `corner-full` is 9999px. Compose
[`ShapeTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ShapeTokens.kt)
uses `CircleShape` for `CornerFull`; native behavior must preserve that
geometric intent rather than promote either finite radius as its source
value. The other nine kit corner values agree numerically with Compose;
[`source-shape.test.mjs`](../tests/source-shape.test.mjs) checks all ten
against the pinned inventories. The kit's
[rendered corner scale](figma-exports/corner-radius.png) labels Full as `50%`;
record that usage distinction instead of assuming the numeric variable and
display example are identical CSS values. The separate
[35-shape set](figma-exports/expressive-shapes.png) is additional Expressive
geometry beyond the ten corner variables and needs its own native coverage.
The frozen kit inventory's `Shape Set` variants (`58548:7248`) include
`Hexagon` but no `Clamshell`. Inspecting the same component set in the Figma
working copy on 2026-09-26 confirms that its six-sided variant
(`58548:7271`) has the property value `Hexagon`, while the text directly below
that variant labels it `Clamshell` in the rendered guide. The naming mismatch
is therefore present within the working copy, not solely between revisions.
The variant's [380×380 SVG export](figma-exports/shape-hexagon.svg), SHA256
`4395ebac155f2e28c98b01747ba5c7c8056bc29049f25dee925212fee1a837b4`,
preserves the six-sided rounded outline at this node. Its filled path spans
approximately x=4–376 and y=63–317: a wide, flat-topped shape rather than a
regular hexagon. The [1× PNG export](figma-exports/shape-hexagon.png), SHA256
`f90fcee6bf1c275ea913985d352d7c106d0590297ce55157691cdfbec20af852`,
is a source rendering fixture with transparency. Neither export is evidence
that the native implementation has equal pixels.
Pinned Compose
[`MaterialShapes.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt)
exports `ClamShell` but no `Hexagon`. Its `clamShell()` constructs a rounded,
six-vertex wide outline from three points repeated around the center, making it
a candidate for this variant. This file is byte-identical at the previous and
refreshed Compose pins (SHA256
`08c29828003344914ee0d6783f213b37caae650175cd004ba321eaf3a7d6e434`).
Render the pinned Compose geometry and compare
it with the SVG before equating the names; matching the count of 35 does not
prove shape parity.

The kit has five light and five dark elevation effect styles. Each style's two
shadow geometries and alpha values agree with the corresponding Web level 1–5
layers after ignoring list order. The light level 1 and 2 effect lists reverse
the Web key/ambient order. Material Web paints separate translucent layers,
while the kit effect is a two-shadow Figma style. The same numbers therefore do
not prove the same pixels. Pinned Compose
[`Surface.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)
separates `tonalElevation` from `shadowElevation`: tonal elevation affects a
surface-color overlay and accumulates through parent surfaces, while shadow
elevation controls a shadow independently. A Web shadow level alone cannot
stand in for both values or their component-specific defaults. Compare actual
native shadows against the
[kit's exported light/dark example](figma-exports/elevation.png) on matched
surfaces and dimensions before choosing the rendering method.

## State layers

Pinned Compose
[`StateTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StateTokens.kt)
defines default dragged, focus, hover and pressed layer opacities of 0.16,
0.10, 0.08 and 0.10. The pinned Web-derived compatibility source instead
specifies 0.12 for focus and pressed, while dragged and hover agree. Select
Compose's values for the native default; the
[`source-state.test.mjs`](../tests/source-state.test.mjs) preserves the exact
four-value comparison. This does not select a component's layer color, bounds,
focus indicator, ripple, disabled appearance or mixed-state behavior. Resolve
those from each Compose family and browser interaction semantics before
implementation. The [captured guidance](guidance/state-layers.md) agrees with
the Compose default values but does not supersede them.

## Remaining source evidence

The four [motion clips](motion/README.md) were observed at normal speed in the
earlier source pass. Their retained files still match the recorded hashes, and
the current frame inspection decoded 0, 100, 200, 300, 500, 700, 900 and
1200 ms at those exact timestamps. These clips demonstrate entry and later
reversal, but they do not show interactive interruption or reduced motion.
Those behaviors require independent upstream trajectories and native browser
recordings for each selected motion scenario.

`M3-SRC-001` remains open. A source decision JSON with eight dimensions and
matched light/dark scenario fixtures must be assembled under the verification
contract in `internal/material3-migration/README.md`. This source comparison
does not mark the workbook task verified or approve a pixel tolerance.
