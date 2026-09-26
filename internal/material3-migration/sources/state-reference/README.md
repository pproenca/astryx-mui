# Light/dark state-layer source reference

The [Light](state-light.png) and [Dark](state-dark.png) captures support
`M3-SRC-001`. The first row composites pinned Compose OnSurface over Surface
at rest, hover 8%, focus 10%, pressed 10% and dragged 16%. The second row uses
the baseline filled Button's Primary container, OnPrimary layer and its
separate disabled colors. The source values, kit variable node IDs, capture
environment and image SHA256 hashes are in [`manifest.json`](manifest.json).
These are static source-value browser samples, with no native implementation
or interaction playback. The decision boundary is in
[`compose-state.md`](../compose-state.md).

Run
`M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/state-reference/generate-state-reference.mjs --check`
to reproduce both images. The generator checks the clean AndroidX revision,
`Ripple.kt`, `Surface.kt` and `Button.kt` hashes, Compose token bindings, all
six selected kit light/dark state variables, and the existing pinned Roboto
font's hash and loaded state. It captures 1180 × 560 CSS pixels at DPR 1 in
Chrome 153.0.8010.53 on macOS. A different browser or OS can produce different
PNG bytes despite unchanged source values.

The filled Button's 40 dp visual height and full corner are source geometry
for this example. Its actual interactive target, focus indicator, press
animation, interruption, disabled event behavior and mixed states require
native behavior and motion evidence. The source values derive from **The
Android Open Source Project**, Apache License 2.0; see
[`LICENSE.androidx`](../LICENSE.androidx). Kit variables are by **Material
Design**, CC BY 4.0; see [source attribution](../README.md). The pinned Roboto
fixture is covered by the SIL Open Font License in
[`fonts/README.md`](../fonts/README.md).
