// Copyright (c) Meta Platforms, Inc. and affiliates.
// Minimal Float collection types needed to compile pinned graphics-shapes sources.

package androidx.collection

data class FloatFloatPair(val first: Float, val second: Float)

open class FloatList(protected val values: MutableList<Float> = mutableListOf()) {
    val size: Int
        get() = values.size

    val indices: IntRange
        get() = values.indices

    operator fun get(index: Int): Float = values[index]

    fun first(): Float = values.first()

    fun last(): Float = values.last()

    fun joinToString(): String = values.joinToString()
}

class MutableFloatList(initialCapacity: Int = 0) : FloatList(ArrayList(initialCapacity)) {
    fun add(value: Float) {
        values.add(value)
    }
}
