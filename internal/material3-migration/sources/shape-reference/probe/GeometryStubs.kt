// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only Offset and Size geometry used by MaterialShapes.

package androidx.compose.ui.geometry

import kotlin.math.sqrt

data class Offset(val x: Float, val y: Float) {
    companion object {
        val Zero = Offset(0f, 0f)
    }

    operator fun minus(other: Offset) = Offset(x - other.x, y - other.y)

    operator fun plus(other: Offset) = Offset(x + other.x, y + other.y)

    operator fun times(value: Float) = Offset(x * value, y * value)

    fun getDistance() = sqrt(x * x + y * y)
}

data class Size(val width: Float, val height: Float) {
    companion object {
        val Unspecified = Size(Float.NaN, Float.NaN)
    }
}

val Size.center: Offset
    get() = Offset(width / 2, height / 2)
