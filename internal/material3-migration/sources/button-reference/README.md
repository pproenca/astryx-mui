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
The small Button's round shape has a 20 dp half-height radius and its pressed
shape has 8 dp corners.

The [independent Chrome calculation](browser-button-shape-motion.json)
evaluates the visible pressed fraction without calling the Kotlin probe or
native package. For two rounded endpoints, Compose's progress and velocity
flip is equivalent to retargeting that visible fraction while retaining its
velocity. Across 61 samples, the maximum position difference is
0.000000057 interpolation units, the maximum velocity difference is
0.000000516 units/s, and settling differs by 0 ms. The final release settles
at 1000 ms under the stated 0.0001 position/velocity criteria. These are
measured source discrepancies, **not** approved native tolerances.

The [render manifest](render-manifest.json) hashes 20 selected light/dark
frames, four reduced-motion adaptation frames, and [light](compose-button-shape-light.mp4)
and [dark](compose-button-shape-dark.mp4) normal-speed clips at 50 fps. Chrome
153 on macOS renders at 960 × 320 CSS pixels and DPR 1 with the pinned SIL
OFL Roboto fixture. The five visual rows use pinned Compose light/dark color
roles and the same small-button shape path. This projection deliberately omits
state layers, ripple, and interaction elevation, which have separate source
evidence. It does not establish full visual or behavioral parity.

I watched both clips at normal speed and inspected the 0, 20, 100, 120, 160,
180, 260, 600, 880, and 1000 ms frames. At the first 120 ms release, the
pressed fraction is 0.95226747; after reversal it is 0.5126354 at 160 ms.
The 160 ms repress reverses it again, and the path reaches 0.93248075 at
260 ms. Final release returns the shape to the rounded resting endpoint by
1000 ms. The reduced-motion frames show immediate pressed and resting shapes;
this is a browser accessibility adaptation, not a specified Compose behavior.
The clipped shape path applies only when the optional Expressive `ButtonShapes`
overload is used; the standard overload does not morph its shape by default.

Reproduce the evidence from the repository root:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/button-reference/capture-button-shape.mjs --check
node internal/material3-migration/sources/button-reference/capture-browser-button-shape.mjs --check
node internal/material3-migration/sources/button-reference/render-button-shape.mjs --check
```

Button interaction elevation uses a separate tween in pinned Compose
`Elevation.kt`; its timed media remains pending. Native implementation also
needs rendered interaction, matched pixels, keyboard, form, focus, theme,
responsive, and performance acceptance at its own verified revision.

The AndroidX source is © The Android Open Source Project, Apache-2.0, and
is read from the external pinned checkout rather than redistributed. See
[`LICENSE.androidx`](../LICENSE.androidx). The bundled Roboto fixture is
licensed under SIL OFL; see the [font attribution](../fonts/README.md).
