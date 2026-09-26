# Pinned Compose typography reference

This source note supports `M3-SRC-001` at AndroidX commit
[`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/).
The facts below derive from **The Android Open Source Project**, under
[Apache License 2.0](LICENSE.androidx). Compose governs overlapping type metrics. The supplied Figma kit fills explicit
gaps, including a reproducible browser font fixture where Compose names only a
platform family. The referenced files were unchanged in the 26 September refresh.

[`Typography.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Typography.kt)
and
[`TypographyTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypographyTokens.kt)
define the 15 baseline roles and 15 emphasized roles. The emphasized roles are
separate styles, not an automatic switch to an expressive font family. The
[`TypeScaleTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypeScaleTokens.kt)
values supply their sizes, line heights, tracking and weights.

Compose's pinned
[`TypefaceTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypefaceTokens.kt)
maps both `Brand` and `Plain` to platform `FontFamily.SansSerif`; it does not
pin a Roboto binary or Google Sans Flex. The supplied kit's 30 active `M3/`
text styles explicitly name Roboto, so native browser comparisons use the
[pinned Roboto fixture](fonts/README.md) and record its loaded state. Roboto
Flex and Google Sans Flex remain optional, source-selected QA assets rather
than inferred replacements for those styles.

The pinned
[`TypographyTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/TypographyTest.kt)
asserts default families for the 15 baseline roles; a supplied custom family
applies across those roles; a role-specific family wins over the supplied
family; and null or partial custom styles retain the chosen family. The
native theme needs equivalent supported override and fallback tests in browser
semantics, plus explicit tests for the 15 emphasized roles that this upstream
test file does not cover.

Exact Figma-to-native glyph comparison still needs matched viewport, DPR,
content, surface, font file hash, weight, line height, tracking and fallback.
Numeric token agreement alone does not establish visual parity.
