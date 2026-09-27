<!-- Copyright (c) Meta Platforms, Inc. and affiliates. -->

# FocusRing comparison frames

These two browser frames were generated from pinned AndroidX Compose Material 3
focus values and the licensed Roboto font by
`internal/material3-migration/sources/indication-reference/generate-focus-reference.mjs`
at AndroidX commit `a095da93f8e98dea8748ceed79ea8427aade245f`.
The captured 260 ms frame follows focus at 0 ms, blur at 120 ms, and refocus at
160 ms. Its optional inset rings have reached the 0/2 px outer and 1/3 px inner
stroke geometry. The source is Apache-2.0; font licensing is retained in
`../../fonts/OFL.txt`. The complete watched source sequence remains in the
disposable migration harness until final audit.

The four `web-outward-*` frames are the selected pinned Material Web gap
reference at commit `cbd34a8921915af94d5ef65c2a69eece41d5b4f3`. They
capture the resting 3 px and peak 8 px outlines with a 2 px offset. The native
test takes a full 960×360 Chrome screenshot before cropping, matching the
source capture path, and requires zero changed pixels at every retained crop.

`standard-focus.json` and `expressive-focus.json` are Kotlin-generated samples
from pinned Compose `SpringSimulation.kt` for focus, blur, refocus and settling.
The package browser test reads those samples at 20 ms intervals and applies
the owner-approved 0.0002 position, 0.002 velocity and 0 ms settling limits.
