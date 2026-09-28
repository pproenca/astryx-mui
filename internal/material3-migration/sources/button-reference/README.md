# Pinned Compose Button pressed-shape reference

This reference covers the shared five-style Button family (`CM-0002` through
`CM-0006`). It probes the pinned Compose Expressive `ButtonShapes` overload's
pressed-shape path. It is **not** an Android device capture, native Astryx
Button, or pixel-accurate Compose screenshot. The
[family decision](../families/family-CM-0002.md) owns source precedence.

[`capture-button-shape.mjs`](capture-button-shape.mjs) checks the clean pinned
AndroidX commit and hashes of `Button.kt`, `AnimatedShape.kt`, the standard
and Expressive motion tokens, and `SpringSimulation.kt`. It compiles the actual
pinned `SpringSimulation.kt` with a small
[`ButtonShapeProbe.kt`](ButtonShapeProbe.kt) that replays the two-shape
`AnimatedShapeState` progress/velocity flip. The 61 samples in
[`button-shape-motion.json`](button-shape-motion.json) run at 20 ms intervals
through 1200 ms. Press starts at 0 ms, release interrupts at 120 ms, repress
reverses at 160 ms, and final release starts at 600 ms. Both motion schemes
select the same no-bounce `DefaultEffects` spring (damping 1, stiffness 1600).
The small Button's resting round shape has a 20 dp half-height radius; its
resting square shape has 12 dp corners. Both press to 8 dp corners.

The [independent Chrome calculation](browser-button-shape-motion.json)
evaluates the visible pressed fraction without calling the Kotlin probe or
native package. For two rounded endpoints, Compose's progress and velocity
flip is equivalent to retargeting that visible fraction while retaining its
velocity. Across 61 samples, the maximum position difference is
0.000000057 interpolation units, the maximum velocity difference is
0.000000516 units/s, and settling differs by 0 ms. The final release settles
at 1000 ms under the stated 0.0001 position/velocity criteria. The owner
approved source comparison limits of 0.0002 pressed-fraction units,
0.002 units/s and 0 ms settling difference on 2026-09-28. The measured
differences pass those limits; they are **not** native acceptance tolerances.

The [render manifest](render-manifest.json) hashes 20 selected light/dark
frames, four reduced-motion adaptation frames, and [light](compose-button-shape-light.mp4)
and [dark](compose-button-shape-dark.mp4) normal-speed clips at 50 fps. Chrome
153 on macOS renders at 960 × 360 CSS pixels and DPR 1 with the pinned SIL
OFL Roboto fixture. Five style columns show both small Round and Square types,
using pinned Compose light/dark color roles and the shared pressed-shape path.
This projection deliberately omits state layers, ripple, and interaction
elevation, which have separate source evidence. It does not establish full
visual or behavioral parity.

I watched both clips at normal speed and inspected the 0, 20, 100, 120, 160,
180, 260, 600, 880, and 1000 ms frames. At the first 120 ms release, the
pressed fraction is 0.95226747; after reversal it is 0.5126354 at 160 ms.
The 160 ms repress reverses it again, and the path reaches 0.93248075 at
260 ms. Final release returns the shape to the rounded resting endpoint by
1000 ms. The reduced-motion frames show immediate pressed and resting shapes
for both Round and Square types; this is a browser accessibility adaptation,
not a specified Compose behavior.
The clipped shape path applies only when the optional Expressive `ButtonShapes`
overload is used; the standard overload does not morph its shape by default.

Reproduce the evidence from the repository root:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/button-reference/capture-button-shape.mjs --check
node internal/material3-migration/sources/button-reference/capture-browser-button-shape.mjs --check
node internal/material3-migration/sources/button-reference/render-button-shape.mjs --check
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/button-reference/capture-button-elevation.mjs --check
node internal/material3-migration/sources/button-reference/render-button-elevation.mjs --check
```

[`capture-button-elevation.mjs`](capture-button-elevation.mjs) hashes and
checks pinned `Button.kt`, `internal/Elevation.kt`, `Easing.kt`, generated
elevation levels, and filled, elevated, and tonal Button tokens. It
reconstructs the source-specified cubic tweens; it does **not** run an Android
`Animatable`. The [37-sample trace](button-elevation-motion.json) covers hover
entry at 0 ms, press interruption at 80 ms, release back to hover at 140 ms,
hover exit at 220 ms, reentry at 240 ms, final exit at 360 ms, disable snap at
500 ms, and enable snap at 580 ms. Elevated Button transitions between level 1
(1 dp) and level 2 (3 dp); filled and tonal transition between level 0 (0 dp)
and level 1 (1 dp). Outlined and text default to no elevation object (0 dp).
The pinned 150 ms outgoing press tween is retained in the trace as a source
specification; default Button press and rest elevations coincide, so that
tween has no visible default-state path. Disabled and reenabled targets snap.

The independent Chrome Web Animations comparison differs by at most 0.0000091
dp for elevated and 0.00000075 dp for filled/tonal. The owner approved a
0.001 dp source comparison limit and 0 ms event-timing difference on
2026-09-28. Both pass. The browser elevation reconstruction reuses the pinned
change timestamps, so its 0 ms schedule difference is by construction, not an
independent timing capture. These source limits are **not** native acceptance
limits. The
[elevation render manifest](elevation-render-manifest.json) hashes 32 selected
light/dark frames, four reduced-motion adaptation frames, and
[light](compose-button-elevation-light.mp4) and
[dark](compose-button-elevation-dark.mp4) normal-speed clips. I watched both
clips and inspected the transition and snap frames. The diagrams resolve
colors from the pinned Compose palette and show pinned source dp values;
their shadow blur and bars are browser schematics,
**not** Compose device shadow pixels. Reduced-motion frames show immediate
browser adaptation endpoints, not a specified Compose behavior.

Native implementation still needs rendered interaction, matched pixels,
keyboard, form, focus, theme, responsive, and performance acceptance at its
own verified revision.

The AndroidX source is © The Android Open Source Project, Apache-2.0, and
is read from the external pinned checkout rather than redistributed. See
[`LICENSE.androidx`](../LICENSE.androidx). The bundled Roboto fixture is
licensed under SIL OFL; see the [font attribution](../fonts/README.md).
