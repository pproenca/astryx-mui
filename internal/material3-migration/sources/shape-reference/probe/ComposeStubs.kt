// Copyright (c) Meta Platforms, Inc. and affiliates.
// Compile-only Compose runtime signatures; no UI behavior is simulated.

package androidx.compose.runtime

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.TYPE)
annotation class Composable

fun <T> remember(vararg keys: Any?, calculation: () -> T): T = calculation()
