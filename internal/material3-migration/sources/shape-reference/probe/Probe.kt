// Copyright (c) Meta Platforms, Inc. and affiliates.
// Emit the 35 pinned MaterialShapes normalized cubic paths in kit display order.

package androidx.compose.material3

fun main() {
    val shapes = listOf(
        "Circle" to MaterialShapes.Circle,
        "Square" to MaterialShapes.Square,
        "Slanted" to MaterialShapes.Slanted,
        "Arch" to MaterialShapes.Arch,
        "Fan" to MaterialShapes.Fan,
        "Arrow" to MaterialShapes.Arrow,
        "SemiCircle" to MaterialShapes.SemiCircle,
        "Oval" to MaterialShapes.Oval,
        "Pill" to MaterialShapes.Pill,
        "Triangle" to MaterialShapes.Triangle,
        "Diamond" to MaterialShapes.Diamond,
        "ClamShell" to MaterialShapes.ClamShell,
        "Pentagon" to MaterialShapes.Pentagon,
        "Gem" to MaterialShapes.Gem,
        "VerySunny" to MaterialShapes.VerySunny,
        "Sunny" to MaterialShapes.Sunny,
        "Cookie4Sided" to MaterialShapes.Cookie4Sided,
        "Cookie6Sided" to MaterialShapes.Cookie6Sided,
        "Cookie7Sided" to MaterialShapes.Cookie7Sided,
        "Cookie9Sided" to MaterialShapes.Cookie9Sided,
        "Cookie12Sided" to MaterialShapes.Cookie12Sided,
        "Ghostish" to MaterialShapes.Ghostish,
        "Clover4Leaf" to MaterialShapes.Clover4Leaf,
        "Clover8Leaf" to MaterialShapes.Clover8Leaf,
        "Burst" to MaterialShapes.Burst,
        "SoftBurst" to MaterialShapes.SoftBurst,
        "Boom" to MaterialShapes.Boom,
        "SoftBoom" to MaterialShapes.SoftBoom,
        "Flower" to MaterialShapes.Flower,
        "Puffy" to MaterialShapes.Puffy,
        "PuffyDiamond" to MaterialShapes.PuffyDiamond,
        "PixelCircle" to MaterialShapes.PixelCircle,
        "PixelTriangle" to MaterialShapes.PixelTriangle,
        "Bun" to MaterialShapes.Bun,
        "Heart" to MaterialShapes.Heart,
    )
    shapes.forEach { (name, polygon) ->
        println(name + "|" + polygon.cubics.joinToString(";") { it.points.joinToString(",") })
    }
}
