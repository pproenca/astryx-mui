# Pinned Compose elevation decision

This source decision supports workbook task `M3-SRC-001`. Pinned AndroidX
[`ElevationTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt),
[`ColorScheme.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ColorScheme.kt),
and [`Surface.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)
are the overlapping design and behavior source. Derived facts here are from
**The Android Open Source Project**, Apache License 2.0; see
[`LICENSE.androidx`](LICENSE.androidx).

| Level | Compose dp | Tonal overlay alpha |
| ----: | ---------: | ------------------: |
|     0 |          0 |                   0 |
|     1 |          1 |             0.05119 |
|     2 |          3 |             0.08238 |
|     3 |          6 |             0.10757 |
|     4 |          8 |             0.11888 |
|     5 |         12 |             0.13542 |

The alpha is zero at `0.dp`; for a nonzero elevation, pinned
`surfaceColorAtElevation` computes
`(4.5 × ln(elevation.value + 1) + 2) / 100`, then composites `surfaceTint`
at that alpha over `surface`. The table rounds only for display. Baseline Light
and Expressive Light use `surface` RGB (254, 247, 255) and `surfaceTint` RGB
(103, 80, 164); Dark uses (20, 18, 24) and (208, 188, 255), respectively.
These colors come from the pinned Compose palette and role bindings. This
formula is a source rule, not a universal CSS elevation token: browser color
space, rounding and surface content must be matched before pixel acceptance.

`Surface` exposes `tonalElevation` and `shadowElevation` independently, both
defaulting to zero. Tonal elevation accumulates through parent surfaces for
the public `Surface` overloads and colors only a background equal to the
scheme's `surface` while tonal elevation is enabled. The shadow uses the
surface's own `shadowElevation`, without parent accumulation. One internal
`Surface` overload applies its own tonal elevation directly; native family
research must inspect the chosen overload before copying its behavior. No
single level value implies both a tint and a shadow. Component token defaults
and interactive changes must be selected per family.

The [rendered Material elevation guidance](guidance/elevation.md) says surface
tint is deprecated. That describes its current guidance, but does not replace
the pinned Compose `surfaceColorAtElevation` behavior for this migration. The
guide's general one-level hover rule likewise cannot replace a component's
explicit Compose state token.

The kit has separate light/dark level 1–5 effect styles; their two numeric
shadow layers match pinned Material Web's levels after ignoring list order.
The light level 1 and 2 kit arrays reverse the Web layer order. The
[`source-elevation` check](../tests/source-elevation.test.mjs) validates all ten
styles against the pinned inventories and all six Compose levels against Web's
generated dp values. Kit effects are by **Material Design**, CC BY 4.0; see
the [kit source and license](README.md). Kit/Web geometry fills the browser
shadow rendering gap only when a selected component calls for a shadow.
Compose's platform shadow renderer does not prescribe those CSS pixels. A
native comparison must capture the selected level and state on equal surfaces
in both modes, including a nested tonal surface and independently changed
shadow, before accepting its visual rendering.
The [light/dark source-value captures](elevation-reference/README.md) provide
repeatable browser scenarios for the six levels and nested tonal color while
showing the browser shadow geometry as a separate reference. They are not
Android renderer or native-product pixels.
