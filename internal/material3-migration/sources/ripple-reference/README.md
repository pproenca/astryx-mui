# Pinned Compose Ripple source reference

This source reference serves workbook mapping `CM-0042` (`md-ripple`) and the
shared Ripple source decision in
[`family-CM-0023.md`](../families/family-CM-0023.md). It covers the press
indication and state-layer motion. The pinned
[`state-layer reference`](../state-reference/README.md) gives the hover, focus
and dragged opacity colors; the
[`state-layer motion manifest`](state-motion-manifest.json) and
[`clip`](compose-state-motion.mp4) capture their transitions. These references
do not define a public `Ripple` export or establish native acceptance.

The [manifest](manifest.json) pins AndroidX
`a095da93f8e98dea8748ceed79ea8427aade245f`, the common Ripple node,
`RippleAnimation.kt`, Compose color and state tokens, and the FastOutSlowIn
easing source. The browser renderer uses the pinned 75ms linear opacity entry,
225ms FastOutSlowIn radius growth, 225ms linear move toward center, and 150ms
linear exit. At a 220 × 92 CSS-pixel owner and DPR 1, the start radius is 66px;
the unbounded end is half the diagonal, while the bounded end adds 10px. The
bounded circle starts at the press point and clips to the owner; the unbounded
circle starts at its center and can extend outside. Both use OnSurface at 10%.

The sequence exercises an early release at 50ms, a second press at 160ms, a
third press at 300ms that finishes the second, and release at 400ms. The first
release switches draw alpha to its final value immediately, but radius and
center continue through their 225ms entry before fading out. A new press can
overlap a fading prior circle. The [clip](compose-ripple.mp4) plays this
sequence at 50fps, and the manifest hashes 28 timed light/dark frames plus
four reduced-motion browser adaptations. The frames are **browser projections
of pinned source values**, not Compose device screenshots.

I watched the generated clip at normal browser playback and inspected
[`20ms`](ripple-light-0020.png), [`160ms`](ripple-light-0160.png),
[`320ms`](ripple-light-0320.png), and
[`525ms`](ripple-dark-0525.png) frames. The bounded circle is soft and clipped
at 20ms; the unbounded circle extends beyond its owner by 160ms. At 320ms the
overlapping prior and new circles remain visible, and by 525ms the bounded
surface is uniformly covered while the unbounded circle still extends outward.
The reduced-motion frames show immediate pressed feedback and immediate
clearance without radius travel. That is a browser accessibility adaptation;
the Compose source does not specify a reduced-motion default for Ripple.

## State-layer transitions

The shared Compose Ripple node keeps only the most recent active hover, focus
or drag interaction visible. Its `Animatable` retargets from its current alpha.
Hover enters and exits in 15ms, focus and drag enter in 45ms, focus exits in
15ms, and drag exits to rest in 150ms, all with linear easing. Stopping a drag
while hover remains retargets to hover's 8% alpha over the **incoming hover
15ms** tween. The [`state-motion-manifest.json`](state-motion-manifest.json)
records the pinned source hash, interactions, exact sampled alpha, light/dark
frame hashes and the clip hash.

The 1.02s [state-layer clip](compose-state-motion.mp4) plays at 50fps. It shows
hover 0–80ms, drag over hover 80–180ms, return to hover 180–220ms, focus
300–420ms, an interrupted drag 500–530ms, and a held drag 720–820ms followed
by its longer exit. The light and dark frames pair OnSurface over Surface with
OnPrimary over a filled Button. I watched the clip at normal browser speed and
inspected the [`100ms`](state-motion-light-0100.png),
[`187ms`](state-motion-light-0187.png),
[`320ms`](state-motion-light-0320.png),
[`580ms`](state-motion-dark-0580.png) and
[`870ms`](state-motion-dark-0870.png) frames. At 100ms the drag alpha is
0.1156 while it is still entering; at 187ms the layer has reversed from 16%
to 12.27% on its way back to hover. At 320ms focus is 4.44%. The interrupted
drag is 7.11% at 580ms, and the full drag exit is 10.67% at 870ms. This
shows the intermediate state rather than only the final opacity.

The reduced-motion [`drag`](state-motion-light-reduced-500.png) and
[`cancel`](state-motion-light-reduced-530.png) frames snap to the final active
alpha and immediately clear. That immediate browser fallback is an
accessibility translation, not a Compose default. These frames and clip are
**browser projections of pinned Compose values**, not Compose device raster
or native component acceptance.

## Independent browser interpolation

[`capture-browser-ripple.mjs`](capture-browser-ripple.mjs) compares the pinned
Compose equations with Chrome's Web Animations API at 5ms intervals. Its
[`measurement`](browser-ripple-motion.json) covers six bounded/unbounded press
traces (456 samples) and the state layer's hover, focus, drag, reversal and
early cancellation (195 samples). Chrome's computed transform and opacity
values differed by at most 0.000445px for the press center, 0.000318px for
radius, 0.00000045 alpha, 0.1244px/s geometric velocity and 0.000178/s alpha
velocity. The final press and state layer settled at the pinned 675ms and
970ms, respectively. The trace records intermediate early-release and
drag-cancel values; it does not certify any native component.

The owner approved limits of 0.001px for press radius and center, 0.2px/s for
their velocity, 0.000001 for press and state-layer alpha, 0.0005/s for alpha
velocity, and 0ms settling difference. The
[`source baseline`](../baseline/ripple-compose-first.json) records the decision;
the browser capture fails when any limit is exceeded. The source renderer
remains a separate projection from Chrome's animation engine. Native Ripple
still needs its own interactive, pixel and motion acceptance.

Reproduce the reference from the repository root with:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/ripple-reference/generate-ripple-reference.mjs --check
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/ripple-reference/generate-state-motion.mjs --check
node internal/material3-migration/sources/ripple-reference/capture-browser-ripple.mjs --check
```

Both generators check the clean AndroidX checkout, source hashes, values,
Roboto font hash and loaded state, then compare all PNG, MP4 and manifest
bytes.
The native task must separately capture matched light/dark pixels, press
origin, clipping, early release, repeated press, pointer cancellation, touch
scroll, keyboard and reduced-motion behavior. The pinned Web 150ms touch delay
and 450ms growth are conflicting source values, not defaults adopted here.

AndroidX is © The Android Open Source Project, Apache-2.0; see
[`LICENSE.androidx`](../LICENSE.androidx). The licensed Roboto fixture is
documented in [`fonts/`](../fonts/README.md). The frozen Figma kit is © Material
Design, CC BY 4.0, and its owning control states remain in their families.
