// Copyright (c) Meta Platforms, Inc. and affiliates.
// Shape reversal algorithm: Copyright The Android Open Source Project, Apache-2.0.

package androidx.compose.animation.core

/** Replays the pinned AnimatedShapeState two-shape reversal with SpringSimulation. */
fun main(args: Array<String>) {
    require(args.size == 3) { "Expected damping, stiffness, and end time" }
    val damping = args[0].toFloat()
    val stiffness = args[1].toFloat()
    val endMs = args[2].toInt()
    val stepMs = 20
    require(damping >= 0f && stiffness > 0f && endMs >= 600 && endMs % stepMs == 0)

    // startShape and targetShape are represented by their pressed-shape fraction.
    // This follows AnimatedShapeState.animateToShape for two rounded endpoints.
    var startShape = 0f
    var targetShape = 0f
    var startProgress = 1f
    var startVelocity = 0f
    var segmentStart = 0
    var spring = SpringSimulation(1f).also {
        it.dampingRatio = damping
        it.stiffness = stiffness
    }
    val changes = listOf(0 to 1f, 120 to 0f, 160 to 1f, 600 to 0f)
    var nextChange = 0
    for (timeMs in 0..endMs step stepMs) {
        if (nextChange < changes.size && timeMs == changes[nextChange].first) {
            val current = spring.updateValues(
                startProgress,
                startVelocity,
                (timeMs - segmentStart).toLong(),
            )
            val newTarget = changes[nextChange].second
            if (newTarget != targetShape) {
                if (newTarget == startShape) {
                    val oldTarget = targetShape
                    targetShape = newTarget
                    startShape = oldTarget
                    startProgress = 1f - current.value
                    startVelocity = -current.velocity
                } else {
                    startShape = startShape + (targetShape - startShape) * current.value
                    targetShape = newTarget
                    startProgress = 0f
                    startVelocity = 0f
                }
                segmentStart = timeMs
                spring = SpringSimulation(1f).also {
                    it.dampingRatio = damping
                    it.stiffness = stiffness
                }
            }
            nextChange++
        }
        val current = spring.updateValues(
            startProgress,
            startVelocity,
            (timeMs - segmentStart).toLong(),
        )
        val fraction = startShape + (targetShape - startShape) * current.value
        val velocity = (targetShape - startShape) * current.velocity
        println("$timeMs\t$fraction\t$velocity")
    }
}
