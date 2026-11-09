# Native Elevation source matrices

The light and dark PNGs show six shadow levels in ascending order, left to
right across two rows. They contain no text or font. Chrome
`153.0.8010.53` captured both at 960×360 CSS pixels and DPR 1 on macOS.

The levels 0, 1, 3, 6, 8 and 12dp come from the pinned AndroidX Compose
Material 3 `ElevationTokens.kt` and `Surface.kt` at
`a095da93f8e98dea8748ceed79ea8427aade245f`. The independent key and
ambient shadow geometry and 0.3/0.15 opacities come from the pinned Material
Web `material3ElevationSource.json` extraction at
`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`, reconciled with the
frozen Figma effect styles. The source gap and precedence are recorded in
`internal/material3-migration/sources/families/family-CM-0018.md`.

`packages/material3/scripts/check-elevation-native-baseline.mjs` regenerates
the reference page from that pinned geometry and requires byte-identical
PNG output before comparing the public native component. The images are
static source-value browser projections. They do not claim a standalone
Compose Elevation composable or default motion.

Material source values are copyright Google LLC and The Android Open Source
Project, Apache-2.0. The Material Design Kit by Google is licensed CC BY 4.0.
See `packages/material3/LICENSE-APACHE-2.0` and
`packages/material3/THIRD_PARTY_NOTICES.md`.
