# Pinned Compose Ripple comparison frames

These eight 960×360, DPR 1 Chrome source-value frames preserve the selected
visual states from the pinned AndroidX Compose Material 3 ripple implementation
at `a095da93f8e98dea8748ceed79ea8427aade245f`. The source frame generator
resolved Compose `RippleAnimation.kt`, `CommonRipple.kt`, `Ripple.kt`,
`Easing.kt`, palette and state tokens before rendering. It used the licensed
Roboto variable font in `../../fonts/` under its SIL Open Font License. The
captured Chrome version was 153.0.8010.53 on macOS, with DPR 1.

Copyright The Android Open Source Project and Google LLC. Licensed under
Apache-2.0; see `../../../LICENSE-APACHE-2.0`. Native comparison and test
implementation Copyright Meta Platforms, Inc. and affiliates.

`manifest.json` records each retained frame hash. The native pixel regression
uses the same viewport, font, Material color roles, content and frame time. The
owner approved at most five changed pixels per frame on 2026-09-27 after
eight measured captures found 0–5 changed circle-edge antialiasing pixels.
