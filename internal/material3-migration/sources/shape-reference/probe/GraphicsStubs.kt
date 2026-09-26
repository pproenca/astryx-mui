// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only drawing types; source cubics bypass Path rendering.

package androidx.compose.ui.graphics

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection

class Matrix {
    var angle = 0f
    var sx = 1f
    var sy = 1f

    fun rotateZ(degrees: Float) {
        angle = degrees
    }

    fun scale(x: Float, y: Float) {
        sx = x
        sy = y
    }
}

class Path {
    fun rewind() {}

    fun addPath(other: Path) {}

    fun transform(matrix: Matrix) {}

    fun translate(offset: Offset) {}

    fun getBounds() = Bounds()
}

class Bounds {
    val center = Offset.Zero
}

sealed class Outline {
    class Generic(val path: Path) : Outline()
}

interface Shape {
    fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline
}
