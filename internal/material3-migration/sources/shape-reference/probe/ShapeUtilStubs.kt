// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only polygon transform matching the pinned rotation and scale uses.

package androidx.compose.material3.internal

import androidx.collection.FloatFloatPair
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.Path
import androidx.graphics.shapes.Morph
import androidx.graphics.shapes.RoundedPolygon
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

fun RoundedPolygon.transformed(matrix: Matrix): RoundedPolygon =
    transformed { x, y ->
        val angle = matrix.angle * PI.toFloat() / 180f
        val transformedX = x * matrix.sx * cos(angle) - y * matrix.sy * sin(angle)
        val transformedY = x * matrix.sx * sin(angle) + y * matrix.sy * cos(angle)
        FloatFloatPair(transformedX, transformedY)
    }

fun RoundedPolygon.toPath(
    path: Path,
    startAngle: Int,
    repeatPath: Boolean,
    closePath: Boolean,
): Path = path

fun Morph.toPath(path: Path, progress: Float, startAngle: Int): Path = path
