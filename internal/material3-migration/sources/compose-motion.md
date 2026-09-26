# Pinned Compose motion reference

This source note supports `M3-SRC-001`. It records the motion facts available in
the pinned AndroidX checkout at
[`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/).
The [source index](compose-inventory.json) identifies candidate files and tests;
the Kotlin sources below resolve the actual behavior. The extracted token values
are from **The Android Open Source Project**, under
[Apache License 2.0](LICENSE.androidx).

## Scheme and default

[`MotionScheme.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt)
exposes standard and expressive schemes. Each provides fast, default, and slow
specifications for spatial motion and effects motion. Spatial specs cover
position, rotation, and size; effects specs cover color and alpha. The source
constructs all twelve as springs from the generated token files, so a fixed
duration/curve is not an equivalent implementation when an animation can be
interrupted or retargeted.

The pinned [`MotionSchemeTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/MotionSchemeTest.kt)
checks that six token keys resolve to the active scheme and that `MaterialTheme`
uses standard by default while a nested expressive theme overrides it. Those
are upstream assertions to translate for the native theme; they do not specify
browser focus, reduced-motion handling, or a rendered trajectory.

## Spring token values

The values below come from pinned
[`StandardMotionTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt)
and
[`ExpressiveMotionTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt).
The columns are Compose `dampingRatio` and `stiffness` inputs, not CSS
durations or bezier parameters.

| Scheme     | Speed   | Kind    | Damping ratio | Stiffness |
| ---------- | ------- | ------- | ------------: | --------: |
| Standard   | Fast    | Spatial |           0.9 |      1400 |
| Standard   | Default | Spatial |           0.9 |       700 |
| Standard   | Slow    | Spatial |           0.9 |       300 |
| Standard   | Fast    | Effects |           1.0 |      3800 |
| Standard   | Default | Effects |           1.0 |      1600 |
| Standard   | Slow    | Effects |           1.0 |       800 |
| Expressive | Fast    | Spatial |           0.6 |       800 |
| Expressive | Default | Spatial |           0.8 |       380 |
| Expressive | Slow    | Spatial |           0.8 |       200 |
| Expressive | Fast    | Effects |           1.0 |      3800 |
| Expressive | Default | Effects |           1.0 |      1600 |
| Expressive | Slow    | Effects |           1.0 |       800 |

## What the baseline still needs

The [watched Material clips](motion/README.md) and
[rendered guidance](guidance/motion.md) show the intended overshoot and the
limited Web curve fallback. They supplement the Compose reference; they do
not replace its spring inputs. A foundation scenario still needs an
independent upstream trace with matched input, units, velocity, target change,
and settle time; a native browser trace; normal-speed review; aligned
intermediate frames; interruption, reversal, and reduced-motion evidence.
The pinned source code and token table alone do not close that scenario.
The [independent upstream trajectories](motion/upstream/README.md) now execute
the pinned Kotlin `SpringSimulation.kt` for all twelve standard and Expressive
token combinations with one interrupted/retargeted input sequence. They
provide source-side positions, velocities and settling for future browser
comparison; uninterrupted entry/exit, reduced motion and a native capture
remain open.
