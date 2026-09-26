# Pinned Compose interaction-state decision

This source decision supports `M3-SRC-001` and the later native shared-state
and Button work. Pinned [`StateTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StateTokens.kt)
sets hover 0.08, focus 0.10, pressed 0.10 and dragged 0.16 as default layer
opacities. Pinned [`Ripple.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Ripple.kt)
uses these values when no ripple configuration overrides them. Its default
focus theme uses an opacity layer; a separate opt-in inset focus-ring theme
exists. Ripple press is an animation, while other interactions show a fixed
layer. Pinned [`Surface.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)
provides the component content color to the default bounded ripple and clips
the clickable indication to its shape. These facts are derived from **The
Android Open Source Project**, Apache License 2.0; see
[`LICENSE.androidx`](LICENSE.androidx).

The baseline filled [`Button.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt)
uses `FilledButtonTokens`: Primary container and OnPrimary content. Its default
state layer therefore takes OnPrimary. `ButtonSmallTokens` gives a 40 dp
visual container with CornerFull shape; the clickable Surface enforces its
own minimum interactive target. The disabled Button uses OnSurface container
at 0.10 alpha and OnSurfaceVariant label at 0.38 alpha, with no hover, focus or
press interaction. These are Button bindings, not a universal rule for all
components. Expressive Button's pressed-shape change is a separate behavior
and motion decision for the Button family.

The frozen kit's `State Layers/On Primary` and `State Layers/On Surface`
variables at opacities 0.08, 0.10 and 0.16 agree with those Compose colors in
Light and Dark. Their exact node IDs are in the
[state-reference manifest](state-reference/manifest.json). The pinned
Material Web-derived source specifies 0.12 for focus and pressed; Compose
governs the native defaults. The [rendered Material guidance](guidance/state-layers.md)
agrees with the four default opacities but gives 38% as a generic disabled
value. That does not replace the filled Button's distinct 10% container and
38% label defaults.

The [light/dark static captures](state-reference/README.md) show default
surface and filled Button endpoint colors. They do not represent the animated
press ripple, interactions that overlap in time, component-specific layer
bounds, or a browser focus indicator. Native web controls must expose visible
keyboard focus and retain button, disabled and form semantics. The selected
focus indicator geometry and mixed-state behavior belong to the native shared
state and component family decisions; no default opacity swatch settles them.
