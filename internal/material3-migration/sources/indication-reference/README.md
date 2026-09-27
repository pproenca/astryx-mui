# Pinned Compose focus indication reference

This source reference is for the workbook `md-focus-ring` mapping (`CM-0023`).
It keeps Compose's default 10% content-color focus layer separate from the
optional inset two-stroke ring. It does not define the public React API or
prove native acceptance. The source routing decision is
[`family-CM-0023.md`](../families/family-CM-0023.md).

The [focus manifest](focus-manifest.json) pins `Ripple.kt`, the common ripple
node, `SpringSimulation.kt`, and the motion token inventory to AndroidX commit
`a095da93f8e98dea8748ceed79ea8427aade245f`. The local
[`FocusProbe.kt`](FocusProbe.kt) executes the pinned Kotlin spring implementation,
switching to fast spatial on focus and fast effects on blur. It carries position
and velocity across interruptions. Its sequence is focus at 0ms, blur at 120ms,
refocus during blur at 160ms, and blur at 600ms. Standard and Expressive
trajectories are in [`standard-focus.json`](standard-focus.json) and
[`expressive-focus.json`](expressive-focus.json).

The [render manifest](manifest.json) records 20 timed Compose light/dark frames,
two reduced-motion browser adaptations, four optional Web outward frames, and a
[normal-speed clip](compose-focus.mp4), sampled every 20ms at 50fps. The
frames are a **browser rendering of pinned source values**, not a Compose
device screenshot. The left rectangle holds the default 10% layer. The center
and right rectangles show the optional inset geometry, using Secondary and
OnSecondary with the pinned 0dp/2dp outer and 1dp/3dp inner inset/stroke pairs.
The CSS renderer rounds fractional stroke widths and insets upward, as the
pinned border logic does at DPR 1. It uses a rectangular owner shape, 220 × 92
CSS pixels, Chrome 153, macOS, and the pinned SIL OFL Roboto fixture. The
[`focus-light-0120.png`](focus-light-0120.png) and
[`focus-dark-0180.png`](focus-dark-0180.png) frames illustrate a focus peak and
refocus during blur; the manifest lists every frame and environment condition.
The renderer snaps interpolation to zero at the probe's declared settling
threshold (880ms), so rounding does not leave a one-pixel ghost border. That
cutoff is a fixture choice, not a claim about a Compose device frame.
The reduced-motion frames show the final focused geometry immediately, without
travel. This is a browser accessibility adaptation; the pinned Compose source
does not specify a reduced-motion default for this ring.

I watched the generated clip at normal browser playback and inspected 20ms,
120ms, and 180ms light/dark frames. The ring enters visibly by 20ms. At 120ms,
the Expressive spatial spring overshoots the standard ring's width. Blur has
reduced both by 160ms, while refocus reverses the ongoing velocity and expands
them again by 260ms. The final blur is visually absent by 880ms. The numeric
source samples are interpolation values, not direct measured border pixels.
At 120ms they are 0.9730014 standard and 1.0783416 Expressive; at the 160ms
refocus they are 0.29119647 and 0.32394052. A browser implementation must
capture its own matched frames and velocity trace; source artifacts alone do
not verify it.

The [Web outward held](web-outward-light-rest.png) and
[active](web-outward-dark-active.png) frames project the pinned Web-only gap:
Secondary, 2px outward host offset, 3px resting outline, 8px active outline,
and a full corner. The manifest pins the two upstream Sass file hashes. These
four browser frames do not change the Compose default or inset option. The
watched pinned Web focus GIF and its timing observations remain in the
[shared family decision](../families/family-CM-0023.md); the animated Web-only
outward option still requires separate native interruption and reduced-motion
verification.

Run both commands from the repository root to reproduce the reference:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/indication-reference/capture-focus-springs.mjs --check
node internal/material3-migration/sources/indication-reference/generate-focus-reference.mjs --check
```

The Kotlin compiler runs the pinned AndroidX `SpringSimulation.kt` from the
external checkout. That upstream file is not redistributed. AndroidX is © The
Android Open Source Project, Apache-2.0; see
[`LICENSE.androidx`](../LICENSE.androidx). The licensed Roboto asset remains
under [`fonts/`](../fonts/README.md). Figma's frozen kit is © Material Design,
CC BY 4.0; its owning component focus variants remain in their families.

## Browser trajectory check

The independent Chrome 153 calculation in
[`capture-browser-focus.mjs`](capture-browser-focus.mjs) evaluates the pinned
spring segments with the same focus, blur and refocus input sequence. Its
[`standard`](browser-standard-focus.json) and
[`Expressive`](browser-expressive-focus.json) records each contain 61 matched
20ms samples. Maximum absolute differences from the Kotlin reference are
0.000000080 interpolation units and 0.00000120 interpolation units per second;
both settle at 880ms. The values include the 120ms blur, 160ms refocus and
600ms final blur. Reproduce both records with:

```sh
node internal/material3-migration/sources/indication-reference/capture-browser-focus.mjs --check
```

This checks a browser calculation against Compose source values. It does not
measure a native FocusRing, rendered pixels, input response or frame pacing.
Its proposed comparison limits still require owner approval before promoting
the component source baseline and preparing implementation.
