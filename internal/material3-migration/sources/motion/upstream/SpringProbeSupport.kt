// Copyright (c) Meta Platforms, Inc. and affiliates.

package androidx.compose.animation.core

// Only the two defaults referenced by pinned SpringSimulation.kt are needed.
// Their values are checked against pinned VectorizedAnimationSpec.kt by the runner.
internal object Spring {
    const val StiffnessVeryLow: Float = 50f
    const val DampingRatioNoBouncy: Float = 1f
}

internal fun throwIllegalArgumentException(message: String): Nothing =
    throw IllegalArgumentException(message)
