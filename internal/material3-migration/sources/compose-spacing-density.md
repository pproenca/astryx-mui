# Pinned Compose spacing and density decision

This source decision supports `M3-SRC-001` and the native Button and TextInput
pilots. Compose does not supply one universal component spacing grid. The
published 8 dp spacing guidance is useful for unowned layout gaps, but each
component's pinned defaults govern its own geometry. Values below come from
**The Android Open Source Project**, Apache License 2.0; see
[`LICENSE.androidx`](LICENSE.androidx).

The baseline filled [`Button.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt)
uses `ButtonDefaults.ContentPadding` by default: 24 dp at start/end and 8 dp
at top/bottom from `BaselineButtonTokens`. Its visual minimum is 58 × 40 dp.
The expressive Button overload selects `contentPaddingFor(MinHeight)` instead.
For the 40 dp small size, that is 16 dp at start/end and 10 dp at top/bottom,
with an 8 dp icon/label gap and 20 dp icon. The baseline `IconSize` remains
18 dp. These are distinct API defaults even though both use a 40 dp minimum
visual height. Larger and extra-small variants use their own token branches;
the small-size values must not be generalized to them.

[`TextFieldDefaults.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TextFieldDefaults.kt)
sets a 280 × 56 dp minimum for both filled and outlined fields. Both use
16 dp inline start/end padding. With an inside label, vertical padding above
the focused label and beneath the input is 8 dp; without an inside label it is
16 dp. The constants are in `TextField.kt` and `internal/TextFieldImpl.kt`.
These values describe default content and container constraints. Label
placement, icons, supporting text, error state and multiline growth require
the TextInput family's own layout and behavior evidence.

The pinned `ComposeMaterial3Flags.isPrecisionPointerComponentSizingEnabled`
defaults to `false`. If explicitly enabled and a precision pointer is
detected, the small Button minimum becomes 36 dp high, with 8 dp vertical
padding and 12 dp horizontal padding adjacent to an icon. This is an opt-in
Compose branch, not a default rule to shrink every web button when a mouse is
present. Native pointer and density policy must be chosen with browser target
and interaction evidence; the [source geometry captures](spacing-reference/README.md)
show the default branch only.

The frozen kit's [Button component set](figma-kit-inventory.json) node
`57994:2227` covers five sizes, states and round/square types, while Text field
node `52798:24373` covers filled/outlined configurations. The export inventory
does not expose exact padding for these variants. Figma may fill a measured
gap after Compose defaults are applied, but the presence of a named variant is
not evidence for a different spacing value. RTL swaps logical start and end;
browser font metrics, zoom and native target size still need matched QA.
