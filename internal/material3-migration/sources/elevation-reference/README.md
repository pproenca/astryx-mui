# Foundation elevation source reference

The [Light](elevation-light.png) and [Dark](elevation-dark.png) captures support
`M3-SRC-001`. Each shows the six pinned Compose elevation levels in three
separate scenarios: tonal color without a shadow, a nested tonal surface, and
browser shadow geometry without a tonal overlay. The numeric inputs and output
colors are recorded in [`manifest.json`](manifest.json). The screenshots are
1280 × 760 CSS pixels at DPR 1 in Chrome 153.0.8010.53 on macOS. They load
the existing pinned, SIL OFL licensed [Roboto fixture](../fonts/README.md)
from `packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf`; its SHA256
and loaded state are checked by the generator.

The tonal row derives the pinned `ElevationTokens.kt` dp levels and
`ColorScheme.surfaceColorAtElevation` alpha formula. The nested sample shows a
3 dp parent and 1 dp child, which use 4 dp absolute tonal elevation on the
child, beside a standalone 1 dp child. For the browser rendition, the source
RGB channels are composited and rounded to 8-bit sRGB. This is a repeatable
source-value fixture, not a claim of identical Android Compose rasterization.
The selected elevation decision is in [`compose-elevation.md`](../compose-elevation.md).

The last row uses pinned Material Web's two-layer shadow geometry with the
kit's black shadow role. It is a CSS visualization of the browser rendering
gap; Material Web paints separate translucent layers, and Figma's effect
renderer can produce different pixels. Actual native shadows must be compared
against the [kit light/dark export](../figma-exports/elevation.png) under
matched surface, size, theme and state. The rows keep tonal and shadow
elevation separate because pinned Compose does so.

Run
`M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/elevation-reference/generate-elevation-reference.mjs --check`
to verify both images and manifest. The generator checks the pinned Compose
formula source SHA, material source pins and Roboto SHA before rendering.
It requires a matching Chrome, OS and font environment for byte-identical PNGs.
Source facts are derived from **The Android Open Source Project**, Apache
License 2.0; see [`LICENSE.androidx`](../LICENSE.androidx). The kit shadow
effects are by **Material Design**, CC BY 4.0; see [source attribution](../README.md).
Material Web is licensed Apache 2.0 and its pinned commit is recorded in the
manifest. These captures do not establish native gallery parity.
