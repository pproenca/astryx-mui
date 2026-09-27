# Pinned Compose Ripple comparison frames

These eight press and sixteen state-layer 960×360, DPR 1 Chrome source-value
frames preserve selected visual states from the pinned AndroidX Compose Material 3 ripple implementation
at `a095da93f8e98dea8748ceed79ea8427aade245f`. The source frame generator
resolved Compose `RippleAnimation.kt`, `CommonRipple.kt`, `Ripple.kt`,
`Easing.kt`, palette and state tokens before rendering. It used the licensed
Roboto variable font in `../../fonts/` under its SIL Open Font License. The
captured Chrome version was 153.0.8010.53 on macOS, with DPR 1.

Copyright The Android Open Source Project and Google LLC. Licensed under
Apache-2.0; see `../../../LICENSE-APACHE-2.0`. Native comparison and test
implementation Copyright Meta Platforms, Inc. and affiliates.

`manifest.json` records each retained frame hash. The native pixel regressions
use the same viewport, font, source palette, content and frame time. The owner
approved at most five changed pixels per press frame on 2026-09-27. For state
layers, the owner separately approved up to one RGB level in the generic flat
fill and five at rounded button edges, with exact pixels outside both controls.
The state comparator combines independently focused generic and filled-button
native controls, since one browser page cannot focus both semantic targets at
once. It verifies hover, drag, focus, interrupted drag, exit and reduced motion.

`source-motion.json` retains the independently captured Chrome/Compose
comparison: 456 press and 195 state samples, representative trace points, and
the pinned source revision. Its SHA-256 is
`66fa157aa2e6aaafffaf5f8f6379e2d1c46eb1fbcf6ee2d184c57e75d5d6eb73`.
The native motion test compares browser animation progress and velocity to the
source equations; the pixel test separately checks raster output.
