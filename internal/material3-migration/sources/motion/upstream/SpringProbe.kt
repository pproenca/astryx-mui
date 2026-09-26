// Copyright (c) Meta Platforms, Inc. and affiliates.

package androidx.compose.animation.core

private data class Change(val timeMs: Int, val target: Float)

fun main(args: Array<String>) {
    require(args.size == 7) { "Expected damping, stiffness, initial position/velocity, changes, end and step" }
    val damping = args[0].toFloat()
    val stiffness = args[1].toFloat()
    var segmentPosition = args[2].toFloat()
    var segmentVelocity = args[3].toFloat()
    val changes = args[4].split(',').map { part ->
        val fields = part.split(':')
        require(fields.size == 2) { "Expected time:target pairs" }
        Change(fields[0].toInt(), fields[1].toFloat())
    }
    val endMs = args[5].toInt()
    val stepMs = args[6].toInt()
    require(changes.isNotEmpty() && changes[0].timeMs == 0)
    require(changes.zipWithNext().all { (a, b) -> b.timeMs > a.timeMs })
    require(stepMs > 0 && endMs > 0 && endMs % stepMs == 0)
    require(changes.all { it.timeMs % stepMs == 0 && it.timeMs <= endMs })

    val spring = SpringSimulation(changes[0].target)
    spring.dampingRatio = damping
    spring.stiffness = stiffness
    var segmentStart = 0
    var nextChange = 1
    for (timeMs in 0..endMs step stepMs) {
        if (nextChange < changes.size && timeMs == changes[nextChange].timeMs) {
            val before = spring.updateValues(
                segmentPosition,
                segmentVelocity,
                (timeMs - segmentStart).toLong(),
            )
            segmentPosition = before.value
            segmentVelocity = before.velocity
            segmentStart = timeMs
            spring.finalPosition = changes[nextChange].target
            nextChange++
        }
        val value = spring.updateValues(
            segmentPosition,
            segmentVelocity,
            (timeMs - segmentStart).toLong(),
        )
        println("$timeMs\t${value.value}\t${value.velocity}")
    }
}
