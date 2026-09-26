# Pinned Compose spring trajectories

The 12 JSON traces in [`traces/`](traces/) are outputs from executing the
pinned AndroidX `SpringSimulation.kt`, not curves fitted to the browser under
test. They cover the fast, default and slow spatial/effects springs in both
standard and Expressive schemes. The pinned `MotionScheme.kt` selects those
token inputs; [`manifest.json`](manifest.json) records the Kotlin source SHA,
compiler, Java runtime, output hashes and measured settle times.

Each probe starts at zero and receives a target at 0 ms. It is retargeted
while moving at 120 ms, reversed at 260 ms, and given its final target at
600 ms. Spatial coordinates use pixels with targets 100, 40, 0 and -100;
effects use opacity with targets 1, 0.4, 0 and 1. The runner records position
and velocity every 20 ms through 3000 ms. `settledAtMs` is the first sample
after the last target change whose position and velocity, and all later
samples, stay within the thresholds recorded under `inputs.settling`. The
standard and Expressive effects traces are equal because their pinned effects
spring tokens are equal. This one input sequence exercises interruption and
reversal; it does not replace separate uninterrupted entry/exit or reduced
motion scenarios.

With `M3_ANDROIDX` pointing to the pinned shallow checkout and the local
Kotlin 2.4.20 compiler dependencies in the Gradle cache, run:

```sh
M3_ANDROIDX=/path/to/androidx node internal/material3-migration/sources/motion/upstream/capture-compose-springs.mjs --check
```

The script checks the checkout commit and source hashes, compiles the original
AndroidX `SpringSimulation.kt` alongside three small local probe files, then
compares all generated trace bytes. The local support files supply only the
two pinned spring default constants, float packing for the return value, and
the sample runner. The analytical spring equation executes from AndroidX's
original Kotlin file. That file remains in the external checkout; it is not
redistributed here.

These outputs are independent source references for later browser capture.
They do not prove native animation, frame pacing, watched playback, matched
intermediate frames or reduced-motion behavior. The published clip
observations remain [separate evidence](../README.md).

The source implementation and token inputs are from **The Android Open Source
Project**, [Apache License 2.0](../../LICENSE.androidx). Local probe code
has its own copyright header. Preserve attribution if any upstream
implementation is later translated into the native package.
