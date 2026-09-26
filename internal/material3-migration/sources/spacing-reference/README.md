# Compose spacing and density source geometry

The [Light](spacing-light.png), [Dark](spacing-dark.png),
[narrow light](spacing-narrow-light.png) and [RTL dark](spacing-rtl-dark.png)
captures diagram
the pinned default geometry for a baseline filled Button, an expressive small
Button, and filled/outlined TextFields with and without an inside label. They
show measurements and role colors so later native comparisons use the same
conditions. They are source diagrams, not Compose screenshots or native
component acceptance. Exact values, source hashes, kit component node IDs,
Chrome environment and image hashes are in [the manifest](manifest.json).

Run
`M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/spacing-reference/generate-spacing-reference.mjs --check`
to reproduce all four PNGs. The generator requires the clean pinned AndroidX
checkout and licensed Roboto fixture. It validates the relevant Kotlin
source hashes and selected expressions before rendering. The captures use
1180 × 640 CSS pixels (390 × 1100 for narrow), DPR 1, Chrome 153.0.8010.53 on macOS. A different
browser or OS may rasterize fonts differently.

The diagrams isolate container and padding values; they do not settle touch
target expansion, floating-label positioning, field edit behavior, pointer
density policy or responsive widths. Those remain native family checks. Values
derive from **The Android Open Source Project**, Apache License 2.0; see
[`LICENSE.androidx`](../LICENSE.androidx). The kit nodes are **Material
Design**, CC BY 4.0; see [source attribution](../README.md). The font is under
the SIL Open Font License; see [font attribution](../fonts/README.md).
