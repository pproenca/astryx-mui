# Pinned Compose text field motion reference

This source reference belongs to the shared filled/outlined field family
(`CM-0021`, `CM-0022`, `CM-0053`, `CM-0054`). It projects pinned Compose
spring values into a browser picture for human motion review. It is **not** an
Android device capture, a native Astryx implementation, or a pixel-accurate
Compose field screenshot. The [family decision](../families/family-CM-0021.md)
owns source precedence.

[`capture-field-springs.mjs`](capture-field-springs.mjs) compiles the pinned
AndroidX `SpringSimulation.kt` with a local
[`FieldSpringProbe.kt`](FieldSpringProbe.kt). The script verifies the clean
AndroidX commit, source hashes, and motion tokens, then writes
[`field-motion.json`](field-motion.json): standard and Expressive label,
placeholder, indicator-thickness, and color trajectories, 81 samples per
property at 20 ms intervals through settling. Focus starts at 0 ms, blur interrupts at 120 ms,
refocus reverses it at 160 ms, and final blur starts at 600 ms. Velocity carries
across each retarget. Filled and outlined use the same selected spring keys;
their source recipes differ in container and stroke geometry.

The [render manifest](manifest.json) records 20 selected light/dark frames, two
reduced-motion adaptation frames, and [light](compose-field-light.mp4) and
[dark](compose-field-dark.mp4) normal-speed clips at 50 fps. The fixture shows
four fields at once: standard and Expressive, each filled and outlined. Chrome
153 on macOS renders at 960 × 420 CSS pixels and DPR 1 with the pinned
SIL OFL Roboto fixture. This projection uses Compose palette roles and scalar
spring positions through 1200 ms. The browser projection places input content
below the minimized label and paints the filled indicator as a rectangle over
the bottom edge, following the pinned Compose layout and indicator node. Its
label raster remains a fixture choice; native pixel acceptance needs a matched reference and an
independent browser trace at the verified implementation revision.

For the FilledField task,
[`generate-filled-field-baseline.mjs`](../baseline/generate-filled-field-baseline.mjs)
copies the exact 280 × 56 RGBA rectangles of the standard and Expressive
filled cards from each of these 22 shared frames. The 44 crops and
[`filled-field-compose-first.json`](../baseline/filled-field-compose-first.json)
reuse this family's source choices and motion references. Their source
coordinates are fixed at x=36 and y=131/269; no browser rerendering, scaling,
or masking occurs. Native captures use the same viewport and crop. The crop
measures the filled container, label, placeholder, and indicator; supporting
text and browser input semantics have separate behavior checks. The shared
composite remains available for the OutlinedField task. The native comparison
fixture places an opaque Surface layer behind the field so gallery heading
glyphs cannot show through its transparent rounded corners. The layer never
covers component pixels.

I watched both clips at normal speed in the browser and inspected the 0, 20,
120, 160, 180, 260, 600, 880, and 1200 ms frames. The label rises and the
placeholder fades in on initial focus. At the 120 ms blur, standard label
progress is 0.973001 and Expressive is 1.078342, visibly overshooting in the
Expressive column. At the interrupted 160 ms refocus they are 0.531699 and
0.694060; both reverse toward the focused label. By 260 ms they are 0.939524
and 0.908734. Indicator thickness follows the same fast spatial path from
1 to 2 dp, while placeholder and color follow their different effects springs.
The final blur returns the fields to their empty resting appearance. The
Expressive label is still 0.008968 at 880 ms and 0.000044 at 1200 ms; it is
visually settled by the last frame. The 1600 ms source probe applies the stated
0.0001 position and velocity criteria to all later samples: standard label
and indicator settle at 980 ms, Expressive label and indicator at 1360 ms,
and both schemes' placeholder and color at 880 ms.

The [independent Chrome calculation](browser-field-motion.json) evaluates the
same spring segments without calling the Kotlin probe or native package. Across
eight paths and 81 matched samples each, the largest source-to-browser
position difference is 0.000000149 dp for indicator thickness; the largest
indicator velocity difference is 0.000001081 dp/s. For the other paths,
the maximum position difference is 0.000000094 interpolation units and the
maximum velocity difference is 0.000001613 interpolation units/s. Every
settling time matches. These are measured source discrepancies; the approved
limits below govern this source comparison only.

### Approved source comparison limits

The owner approved the following limits on 2026-09-29 for comparing the pinned Kotlin probe with
the independent browser spring calculation. The interpolation limits mirror
the [approved Button source limits](../button-reference/README.md); the
indicator position limit uses their 0.001 dp elevation bound as a precedent.
The indicator velocity limit is field-specific. Approval reference:
`human:pproenca:2026-09-29:field-source-limits`. These limits do not authorize
native motion, pixel, or event-timing tolerance.

| Source path                   | Largest measured position difference |    Approved position limit | Largest measured velocity difference |     Approved velocity limit |
| ----------------------------- | -----------------------------------: | -------------------------: | -----------------------------------: | --------------------------: |
| Label, placeholder, and color |      0.000000094 interpolation units | 0.0002 interpolation units |    0.000001613 interpolation units/s | 0.002 interpolation units/s |
| Indicator thickness           |                       0.000000149 dp |                   0.001 dp |                     0.000001081 dp/s |                  0.002 dp/s |

All 81 sample timestamps per path and all settling times must match exactly
(0 ms difference). The browser calculation uses the probe's target-change
schedule, so timestamp agreement does not independently establish runtime
event timing.

### Approved native FilledField motion limits

The owner separately approved the same numeric limits on 2026-09-29 for native
FilledField trajectories against the eight pinned Kotlin source paths. Approval
reference: `human:pproenca:2026-09-29:field-native-motion-limits`. The independent
Chrome 149 capture at revision `dbd8d276cbfeee6b815db9eece8ed3177021ac39`
records 81 samples per path in
[`actual/M3-GAP-009`](../../actual/M3-GAP-009/motion-summary.json). Across label,
placeholder, and color, the maximum measured position difference is
0.000000072 interpolation units and the maximum velocity difference is
0.000001273 interpolation units/s. For indicator thickness, the maxima are
0.000000261 dp and 0.000001449 dp/s. Every sample timestamp and settling time
matches the source exactly (0 ms difference). The product component did not
change between that recording and the current evidence commit.

These limits cover native motion only. Pixel acceptance, the target browser
profile, and human interaction QA still require separate verification.

The reduced-motion frames present the final focused state immediately. This
is a browser accessibility adaptation; pinned Compose does not specify that
reduced-motion behavior for TextField. Disabled indicator color and thickness
snap in Compose and need a separate native state check. The clips do not
model typing, selection, IME, validation, or browser form behavior.

Reproduce the evidence from the repository root:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/field-reference/capture-field-springs.mjs --check
node internal/material3-migration/sources/field-reference/render-field-reference.mjs --check
node internal/material3-migration/sources/field-reference/capture-browser-field.mjs --check
```

The AndroidX source is © The Android Open Source Project, Apache-2.0, and is
read from the external pinned checkout rather than redistributed. See
[`LICENSE.androidx`](../LICENSE.androidx). The bundled Roboto fixture is
licensed under SIL OFL; see the [font attribution](../fonts/README.md).
