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

| Foundation concern | Selected route | Evidence and boundary |
| --- | --- | --- |
| Color | Compose light/dark role-to-palette bindings | `ColorLightTokens.kt`, `ColorDarkTokens.kt`, and `PaletteTokens.kt` define 48 scheme roles per mode. The kit/Web `Shadow` role fills the one missing system-color gap. Kit contrast and named modes remain separately inventoried until their Compose membership is resolved. |
| Typography | Compose's 30 role metrics and override behavior | [`compose-typography.md`](compose-typography.md); kit Roboto is the browser comparison fixture because Compose names only platform SansSerif. |
| Shape | Compose corner shapes and `MaterialShapes.kt` | The kit's 35-shape set supplies comparison nodes; name similarity alone does not establish matching geometry. |
| Spacing and density | Compose component geometry | There is no resolved universal spacing scale in these sources. The kit and captured guidance fill documented component or responsive gaps. |
| Elevation | Compose level and component surface/elevation selection | `ElevationTokens.kt` gives levels 0–5 at 0, 1, 3, 6, 8, 12 dp. Web shadow CSS and kit effects are browser rendering references. |
| Icons | Compose `Icon` sizing/tint behavior where applicable | The kit supplies specified glyphs; pinned Material Symbols artwork fills glyph gaps. Browser semantics and meaningful names remain component decisions. |
| State layers | Compose component interaction and ripple behavior | Kit state styles and rendered guidance help with unspecified presentation; a global opacity list cannot replace per-component behavior. |
| Motion | Compose standard/expressive spatial and effects spring schemes | [`compose-motion.md`](compose-motion.md) records spring inputs. [Watched media](motion/README.md) shows visual intent; Web curves are limited non-interruptible fallbacks. |

This routing selects authority, not a fabricated implementation value. A family
decision must resolve any component-specific gap and its sibling variants before
that family is implemented. Native foundation QA still needs matched light/dark
reference captures, fonts, environments, and motion traces.

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

The refreshed pinned Compose
[`ColorLightTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ColorLightTokens.kt)
binds all four roles to palette tone 10. Its
[`PaletteTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/PaletteTokens.kt)
resolves them to the Web Light column above. Compose therefore selects
`#410E0B`, `#21005D`, `#1D192B`, and `#31111D` for the corresponding native
light roles. The kit's four published values remain recorded disagreements; using
one in place of Compose requires a color-specific approved exception. The
[`ColorDarkTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ColorDarkTokens.kt)
bindings agree with the kit's measured default Dark scheme. The current
Material Web-derived compatibility theme remains historical implementation
evidence, not the native source decision. This comparison does not resolve
Compose membership or role maps for the 30 kit contrast and named-scheme modes;
retain their kit values as source observations without inferring them from
Light/Dark. Derived state-layer colors follow the selected scheme roles.
Both Compose light and dark token files have 48 bindings. Of the kit's 49
`Schemes/` roles, only `Shadow` lacks a corresponding Compose color token.
The kit specifies `#000000` for `Shadow` in all its modes and pinned Material
Web resolves `shadow` to black in light and dark. Use that kit value for the
missing native system-color role; this is a documented gap fill, not an
exception to a specified Compose value. The focused
[`source-color.test.mjs`](../tests/source-color.test.mjs) recomputes all 48
light and dark comparisons from the pinned inventories.
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
matching glyph pixels.

## Shape and elevation

Six shared corner values match exactly: none 0, extra-small 4, small 8,
medium 12, large 16, and extra-large 28px. The kit additionally specifies
large-increased 20px, extra-large-increased 32px, and extra-extra-large 48px.
Its Full value is 1000px, whereas Web's `corner-full` is 9999px. Compose
[`ShapeTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ShapeTokens.kt)
uses `CircleShape` for `CornerFull`; native behavior must preserve that
geometric intent rather than promote either finite radius as its source
value. The kit's
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
not prove the same pixels. Compare actual native shadows against the
[kit's exported light/dark example](figma-exports/elevation.png) on matched
surfaces and dimensions before choosing the rendering method.

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
