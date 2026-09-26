# Foundation color source reference

`color-light.png` and `color-dark.png` are deterministic source-value fixtures
for `M3-SRC-001`. Each is a 224 × 224, opaque sRGB image with 49 solid
32 × 32 tiles in the row-major role order in `manifest.json`. Forty-eight
colors per mode come from the pinned AndroidX `ColorLightTokens.kt` or
`ColorDarkTokens.kt` bindings and `PaletteTokens.kt`. The `shadow` tile fills
the one missing Compose system-color role with the kit's `#000000`, which
agrees with pinned Material Web. The images have no font, browser rendering,
component states, spacing rule, or Material component geometry.

Run `M3_DEPS=/path/to/node_modules node
internal/material3-migration/sources/generate-color-reference.mjs --check`
to reproduce and check their bytes. A native gallery can render the same
ordered, gapless tiles at 224 × 224 CSS pixels and DPR 1 for an exact color
comparison. The browser, OS, theme, capture profile, and diff still need to
be recorded at the verified native revision. These images alone do not pass
foundation QA or establish pixel parity for any component.

The Compose values are derived from **The Android Open Source Project**,
Apache License 2.0; see [`LICENSE.androidx`](../LICENSE.androidx). The
Material 3 Design Kit is by Material Design under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the supplied
export SHA256 and `Shadow` node ID are recorded in `manifest.json`.
