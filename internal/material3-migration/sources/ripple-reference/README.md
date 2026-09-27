# Pinned Compose Ripple press reference

This source reference serves workbook mapping `CM-0042` (`md-ripple`) and the
shared Ripple source decision in
[`family-CM-0023.md`](../families/family-CM-0023.md). It covers the press
indication only. The pinned
[`state-layer reference`](../state-reference/README.md) separately gives the
hover, focus and dragged opacity colors. It does not define a public `Ripple`
export or establish native acceptance.

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

Reproduce the reference from the repository root with:

```sh
M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/ripple-reference/generate-ripple-reference.mjs --check
```

The generator checks the clean AndroidX checkout, source hashes, values, Roboto
font hash and loaded state, then compares all PNG, MP4 and manifest bytes.
The native task must separately capture matched light/dark pixels, press
origin, clipping, early release, repeated press, pointer cancellation, touch
scroll, keyboard and reduced-motion behavior. The pinned Web 150ms touch delay
and 450ms growth are conflicting source values, not defaults adopted here.

AndroidX is © The Android Open Source Project, Apache-2.0; see
[`LICENSE.androidx`](../LICENSE.androidx). The licensed Roboto fixture is
documented in [`fonts/`](../fonts/README.md). The frozen Figma kit is © Material
Design, CC BY 4.0, and its owning control states remain in their families.
