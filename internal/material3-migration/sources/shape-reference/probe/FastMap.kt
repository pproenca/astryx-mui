// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only collection extension used by MaterialShapes.

package androidx.compose.ui.util

inline fun <T, R> List<T>.fastMap(block: (T) -> R): List<R> = map(block)
