# Pinned Compose icon decision

This source decision supports `M3-SRC-001` and the native icon foundation.
Pinned [`Icon.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Icon.kt)
accepts a vector, bitmap or painter. It uses `LocalContentColor` as the default
tint for a single-color icon and applies no tint when `Color.Unspecified` is
provided. A painter with no usable intrinsic size receives
`SmallIconButtonTokens.IconSize`, which is 24 dp in the pinned source. A
meaningful `contentDescription` adds image semantics; a null description is
decorative. `Icon` itself is not clickable: actions use an interactive owner
such as `IconButton`. These values and behavior derive from **The Android Open
Source Project**, Apache License 2.0; see [`LICENSE.androidx`](LICENSE.androidx).

`Icon.kt` does not select the artwork or a Material Symbols font family. The
frozen kit identifies 21 icon-named component sets but its extracted inventory
does not prove glyph geometry or a single global variant. The
[rendered icon guidance](guidance/icons.md) favors Material Symbols and
describes Outlined, Rounded and Sharp families with fill, weight, grade and
optical-size axes. Those sources fill the artwork and presentation gap; exact
glyph, variant, axes and tint still belong to each native component binding.
The [pinned Google icon source](../../../packages/themes/material3/src/material3IconSource.json)
already preserves selected SVG artwork for the Core compatibility registry.
The three [pinned Material Symbols font files](fonts/README.md) are in local QA
cache under their Apache-2.0 source license. The native package contract does
not require Astryx to redistribute those fonts.

A source comparison must record the selected glyph and source hash, outlined
or other family, `FILL`, `wght`, `GRAD` and `opsz` axes, rendered size, loaded
font hash or SVG path, theme and tint. A 24 dp standalone icon is the Compose
fallback for an unsized painter; a Button or another component may choose a
different size. Dark grade -25 and dense 20 dp symbols are guidance examples,
not unconditional Compose defaults. Native browser semantics require a named
image only when meaningful, hidden decoration otherwise, and a labelled
button or equivalent control for an icon action. Visual and keyboard acceptance
must compare that complete control, not only a glyph.
