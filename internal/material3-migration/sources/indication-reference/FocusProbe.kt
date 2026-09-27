// Copyright (c) Meta Platforms, Inc. and affiliates.

package androidx.compose.animation.core

private data class FocusChange(
    val timeMs: Int,
    val target: Float,
    val damping: Float,
    val stiffness: Float,
)

/** Samples the pinned spring implementation while focus and blur retarget one value. */
fun main(args: Array<String>) {
    require(args.size == 4) { "Expected change list, end, step, and initial value" }
    val changes = args[0].split(',').map { entry ->
        val fields = entry.split(':')
        require(fields.size == 4) { "Expected time:target:damping:stiffness" }
        FocusChange(
            fields[0].toInt(),
            fields[1].toFloat(),
            fields[2].toFloat(),
            fields[3].toFloat(),
        )
    }
    val endMs = args[1].toInt()
    val stepMs = args[2].toInt()
    var position = args[3].toFloat()
    var velocity = 0f
    require(changes.isNotEmpty() && changes[0].timeMs == 0)
    require(changes.zipWithNext().all { (a, b) -> b.timeMs > a.timeMs })
    require(stepMs > 0 && endMs % stepMs == 0)
    require(changes.all { it.timeMs % stepMs == 0 && it.timeMs <= endMs })

    var current = changes.first()
    var spring = SpringSimulation(current.target).also {
        it.dampingRatio = current.damping
        it.stiffness = current.stiffness
    }
    var segmentStart = 0
    var nextChange = 1
    for (timeMs in 0..endMs step stepMs) {
        if (nextChange < changes.size && timeMs == changes[nextChange].timeMs) {
            val before = spring.updateValues(position, velocity, (timeMs - segmentStart).toLong())
            position = before.value
            velocity = before.velocity
            current = changes[nextChange]
            spring = SpringSimulation(current.target).also {
                it.dampingRatio = current.damping
                it.stiffness = current.stiffness
            }
            segmentStart = timeMs
            nextChange++
        }
        val value = spring.updateValues(position, velocity, (timeMs - segmentStart).toLong())
        println("$timeMs\t${value.value}\t${value.velocity}")
    }
}
