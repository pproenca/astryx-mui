# Foundation typography source reference

The light and dark PNGs render all 30 pinned Compose type roles at nominal
`fontScale = 1` in Chrome. The generator reads size, line height, tracking and
weight from the Compose source inventory. It uses the selected Compose
`surface` and `onSurface` colors and the licensed pinned Roboto fixture for a
repeatable web comparison. The Compose platform default only names
`SansSerif`, so Roboto here is a documented browser fixture, not a claim that
Android renders the same glyph pixels.

[`manifest.json`](manifest.json) records the exact Chrome and OS kernel versions,
DPR, viewport, image dimensions, font hash and loaded state, content, layout,
and all 30 metric sets. The generator checks the browser's computed metrics
and that every sample fits its cell before capturing. With the same browser
and font available, run `node
internal/material3-migration/sources/generate-typography-reference.mjs
--check` to reproduce the images byte for byte.

These are source typography samples, not native product screenshots. The
eventual native gallery needs separate light/dark, font-scale, responsive and
browser comparisons at its verified revision. Exact Figma glyph parity is
also unverified; the kit differs from Compose in ten type metrics, recorded in
[the type source note](../compose-typography.md).

The metric inputs are derived from **The Android Open Source Project** under
[Apache License 2.0](../LICENSE.androidx). The Roboto font is distributed under
the [SIL Open Font License](../../../../packages/themes/material3/scripts/fonts/OFL.txt).
