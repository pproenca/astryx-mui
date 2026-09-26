# Compose icon and Material Symbols source reference

The [Light](icons-light.png) and [Dark](icons-dark.png) captures render the
pinned 24 dp Compose fallback size with three pinned Material Symbols font
families and selected pinned SVG artwork. They also show a 20 dp icon on a
filled Button color pair. The selected glyphs, axes, font and source hashes,
theme colors and capture environment are in [the manifest](manifest.json).
These are browser source samples, not a native Material component comparison.
The [decision](../compose-icons.md) explains the source boundary.

The generator reads the three WOFF2 files from
`M3_ICON_FONT_CACHE` (default `/private/tmp/astryx-material3-font-cache`),
checks their pinned hashes and captures Chrome after all font faces load. Run
`M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/icon-reference/generate-icon-reference.mjs --check`
to reproduce both files. Each image is 1180 × 640 CSS pixels at DPR 1 with
Chrome 153.0.8010.53 on macOS. Font rasterization may differ in another
browser or OS.

Compose source values derive from **The Android Open Source Project**,
Apache License 2.0; see [`LICENSE.androidx`](../LICENSE.androidx). The pinned
Material Symbols font and SVG artwork are **Google LLC**, Apache License 2.0;
the [font provenance](../fonts/README.md) and
[`material3IconSource.json`](../../../../packages/themes/material3/src/material3IconSource.json)
record their source commit and hashes. The kit is **Material Design**, CC BY
4.0; see [source attribution](../README.md). Native controls still need
component-specific glyph selection, accessible names, focus, target size and
state acceptance.
