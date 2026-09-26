# Compose ClamShell source geometry

This candidate comparison supports `M3-SRC-001`. The
[`compose-clam-shell.svg`](compose-clam-shell.svg) path was exported from the
normalized `MaterialShapes.ClamShell.cubics` at 380 × 380. The pinned
[`MaterialShapes.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt)
SHA256 is `08c29828003344914ee0d6783f213b37caae650175cd004ba321eaf3a7d6e434`;
the pinned `graphics-shapes` `RoundedPolygon.kt` SHA256 is
`15be176fde87c926d259be8eb22aa80209430fa373fabc510fef33185203f48f`.
Both Kotlin sources were compiled directly with Kotlin 2.4.20; minimal local
Compose and collection type shims supplied unavailable dependencies. No
polygon curve was redrawn by hand. The SVG scales each normalized cubic
coordinate by 380 and fills it with `#6750A4`. Its SHA256 is
`2d9cb6b870de366234f7f52f7499e50ae14f62797e203120193256817d322b72`.
The [PNG](compose-clam-shell.png) was captured from that SVG in Chrome
153.0.8010.53, macOS, 380 × 380 CSS pixels, DPR 1, transparent background;
SHA256 `06bbe34d310d57d5809273270cb0ce9d34bb13251e9ffb0a4395d29862eeb35a`.
This renders the source cubics in Chrome, not an Android Compose screenshot.

The kit's 380 × 380
[`Hexagon` PNG](../figma-exports/shape-hexagon.png) has SHA256
`f90fcee6bf1c275ea913985d352d7c106d0590297ce55157691cdfbec20af852`.
At the same canvas and fill, the two nonzero alpha masks intersect over 98.23%
of their union; 2,282 pixels have unequal alpha values. The source capture's
nonzero alpha bounds are x 2–377, y 61–318; the kit's are x 4–375, y 63–316.
The silhouettes are closely corresponding, but this is not exact pixel
identity. The kit's `Hexagon` property and displayed `Clamshell` caption remain
a naming difference. For the overlapping shape, pinned Compose supplies the
geometry; any public name or alias must be resolved with the native shape API.
The full 35-shape family still needs source exports and comparisons.

The Compose geometry is derived from **The Android Open Source Project**,
Apache License 2.0; see [`LICENSE.androidx`](../LICENSE.androidx). The kit
export is by **Material Design**, CC BY 4.0; see [source attribution](../README.md).
These source images do not establish native gallery parity.
