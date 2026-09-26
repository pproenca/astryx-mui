# Pinned Compose spatial-motion source replay

[`compose-default-spatial.mp4`](compose-default-spatial.mp4) renders the
**standard** and **Expressive** default spatial spring positions from the
independent pinned Kotlin traces at 50 frames per second. The input target
changes at 0, 120, 260 and 600 ms; the final state settles by 1120 ms for
standard and 1380 ms for Expressive under the recorded thresholds. The
[Light](motion-light.png) and [Dark](motion-dark.png) contact sheets show six
aligned source times. The [manifest](manifest.json) pins trace hashes, source
commit, sample times, capture environment and output hashes.

Run
`M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/motion/source-reference/generate-motion-reference.mjs --check`
to reproduce the clip and images. The generator checks the clean pinned
AndroidX checkout, both upstream trace hashes and the licensed Roboto font.
It uses Chrome 153.0.8010.53, DPR 1, macOS, and FFmpeg 9.0.2. Each video
frame comes from a position sampled by the pinned Kotlin spring, with no
CSS motion approximation. Browser/video encoder versions can change bytes.

The clip and contact sheets are derived source visualizations, not an Android
Compose raster capture or native Astryx motion. The official Material clips
were [watched separately](../README.md) at normal speed; they show visual
intent but do not demonstrate interruption or reduced motion. The Kotlin
sequence supplies source-side interruption and reversal. Native playback,
intermediate-frame comparison, focus during transition and reduced-motion
behavior remain verification work.

The spring implementation and traces derive from **The Android Open Source
Project**, Apache License 2.0; see [`LICENSE.androidx`](../../LICENSE.androidx).
The Roboto fixture is licensed under the SIL Open Font License; see
[font attribution](../../fonts/README.md).
