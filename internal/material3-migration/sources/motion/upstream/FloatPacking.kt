// Copyright (c) Meta Platforms, Inc. and affiliates.

package androidx.compose.ui.util

// SpringSimulation uses this transport only to return two Float values.
fun packFloats(first: Float, second: Float): Long =
    (first.toRawBits().toLong() shl 32) or (second.toRawBits().toLong() and 0xffffffffL)

fun unpackFloat1(packed: Long): Float = Float.fromBits((packed ushr 32).toInt())

fun unpackFloat2(packed: Long): Float = Float.fromBits(packed.toInt())
