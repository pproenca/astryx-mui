// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only float formatter in place of the multiplatform expect/actual pair.

package androidx.graphics.shapes

internal fun Float.toStringWithLessPrecision(): String = this.toString()
