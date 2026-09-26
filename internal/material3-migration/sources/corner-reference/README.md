# Foundation corner source reference

The light and dark PNGs render all ten pinned Compose corner roles in Chrome
at DPR 1. The nine numeric roles use their `ShapeTokens.kt` radius in CSS
pixels at nominal density 1. `CornerFull` uses `CircleShape` in Compose; its
sample is square so a 50% browser radius is unambiguously circular. The
samples use pinned Compose `surface`, `onSurface` and `primary` colors. The
labels and grid are comparison furniture, not Material component anatomy.

[`manifest.json`](manifest.json) records the role dimensions/radii, image
hashes, Chrome version, OS kernel, viewport and colors. With the same browser
available, run `node
internal/material3-migration/sources/generate-corner-reference.mjs --check`
to reproduce the captures byte for byte. The generator checks computed CSS
geometry before capturing.

These are source metric fixtures for a future native gallery. They do not
prove browser parity for a Material component, non-square `CircleShape`
behavior, the 35 Expressive polygon geometries, morphing or the kit's full
corner variable. The [shape reconciliation](../reconciliation.md#shape-and-elevation)
keeps those distinctions explicit.

The source inputs derive from **The Android Open Source Project** under
[Apache License 2.0](../LICENSE.androidx).
