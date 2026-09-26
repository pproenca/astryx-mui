# Motion reference clips

The rendered [Material motion physics page](https://m3.material.io/styles/motion/overview/how-it-works)
was inspected on 2026-09-26. It distinguishes expressive and standard motion
schemes and spatial and effects springs. The page's four clips below were
downloaded into a local QA cache from the media linked by that page. Their
binary media are not included in this source inventory.

| Page example             | Local file name         | SHA256                                                             |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| Expressive motion scheme | `expressive-spring.mp4` | `50a01e5ed7c252879b246b5decea38a3523cd19146731e8164aff18e260426f1` |
| Standard motion scheme   | `standard-spring.mp4`   | `fcf15bae16b587343d105b39e4a1de82ef6a130261bab567d7b722e8f8b01741` |
| Spatial position spring  | `spatial-position.mp4`  | `8150a00738ddaea786e276a52b7f08b78a4f5ba8d0a0bada909de3d1eb09b3fa` |
| Effects opacity spring   | `effects-opacity.mp4`   | `e176b766ce7816e30dd6b695177d0bb8fe6112fa440023d6c9a21c05bd9d93bc` |

## Observed playback and decoded frames

The four original clips were played in the browser at normal speed (1×) on
2026-09-26. Their 60 fps video frames were then decoded with the migration
CLI's `motion inspect` command at 0, 100, 200, 300, 500, 700, 900 and
1200 ms. These are observations of the published examples, not prescribed
spring constants or a claim that every Material component uses the same timing.

- **Expressive scheme:** The circle travels horizontally into an elongated
  white track. At 100 ms it is past its eventual right-hand position; it
  rebounds through about 300–400 ms and has settled by about 500 ms. The clip
  reverses after a 3 s hold and again overshoots before settling.
- **Standard scheme:** The circle travels horizontally into the same track
  and approaches its right-hand position without visible overshoot. It is at
  that position by about 300 ms. It reverses after a 3 s hold with the same
  non-overshooting response.
- **Spatial position:** The circle moves diagonally among four positions. On
  the first leg, it passes the lower-right target at about 200 ms, rebounds,
  and settles around 600 ms. Later legs show the same positional overshoot.
- **Effects opacity:** A stationary shape fades to the background by about
  200 ms, then fades back in beginning around 2 s. Position and shape remain
  fixed; opacity stays within its endpoints, with no visible overshoot.

The first 1.2 s of each clip was checked at exact decoded timestamps. A
20 fps, quarter-size color-centroid pass corroborated the movement: the
expressive circle's horizontal center passed the settled position by about
7% of its travel at 100 ms; the standard circle did not pass it; the first
spatial leg passed its final position on both axes at 200 ms. Those measurements
are QA observations of the encoded clips, not a pixel baseline or a token.

The [motion specs](https://m3.material.io/styles/motion/overview/specs)
describe spring composites and a Web curve conversion for animations without
interruptions or gestures. The pinned Material Web motion Sass uses older easing
and duration values; do not equate those with the current spring system.
The published loops do not demonstrate interruption, gesture response,
focus behavior or reduced motion. Native implementations must test those
behaviors separately; a prerecorded clip cannot certify them.
The [pinned Compose trajectory probes](upstream/README.md) supply independent
position/velocity references for an interrupted and reversed input sequence.
They execute upstream Kotlin and are separate from these watched visual clips;
neither source by itself verifies native browser motion.
The [Compose source replay](source-reference/README.md) renders two default
spatial traces as a local MP4 and aligned light/dark timed-frame sheets. It is
derived from Kotlin positions and frame-checked; the official clips above are
the separately watched normal-speed references. Native playback and reduced
motion remain open.
