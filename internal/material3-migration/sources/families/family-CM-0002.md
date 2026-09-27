# Button family source research

This decision covers the five Material Web button mappings `CM-0002` through
`CM-0006`: elevated, filled, filled tonal, outlined, and text. They share one
pinned Compose implementation and source route. ButtonGroup, icon-only,
segmented, split, and toggle buttons retain their own family mappings.

## Pinned coverage

- **Compose:** At AndroidX commit
  [`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f),
  [`Button.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt)
  defines all five named composables, their state colors and elevations, the
  baseline overloads, and the Expressive `ButtonShapes` overloads. Generated
  [`BaselineButtonTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/BaselineButtonTokens.kt),
  five size token files, and five style token files provide role and geometry
  values. [`ButtonTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/ButtonTest.kt)
  covers semantics, click and disabled behavior, default colors, dimensions,
  icon placement, precision pointer sizing, and default/pressed shape.
  [`ButtonScreenshotTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/ButtonScreenshotTest.kt)
  has light/dark, style, icon, focus, disabled, and animated-shape captures.
- **Figma:** The frozen Material Design Kit inventory at SHA-256
  `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`
  contains five 50-variant sets: filled `57994:2227`, elevated
  `58650:9294`, outlined `58650:10213`, text `58650:8094`, and tonal
  `58651:11237`. Each exposes five sizes, enabled/hovered/focused/pressed/
  disabled states, and round/square types, with icon and focus-indicator
  properties. These axes confirm design coverage. The frozen inventory does
  not provide a competing exact value or transition timing, so no Figma
  override is selected.
- **Material Web:** At commit
  [`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
  the five named button elements share
  [`button/internal/button.ts`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/button/internal/button.ts).
  It renders a native `button` for actions or an anchor when `href` is set,
  delegates ARIA, and owns form submission and link behavior. Those browser
  semantics supplement Compose without replacing its visual defaults.

## Selected concerns

**Design and defaults: Compose.** The baseline filled Button has a 58 × 40 dp
visual minimum and 24 dp inline/8 dp block content padding. The Expressive
overload selects size-specific padding; extra small through extra large use
their own dimensions, icon sizes, icon gaps, text styles, and round/square
shapes. [`compose-spacing-density.md`](../compose-spacing-density.md) records
the small default and the opt-in precision-pointer size branch. Style tokens
choose each variant's container, content, disabled, outline, state-layer, and
elevation roles. Native controls must consume supported Material tokens
directly; Core Button geometry is not a source substitute.

**Behavior: Compose.** All five are momentary actions with enabled/disabled,
click, focus, hover, and press behavior. The Compose implementation uses an
interaction source for press and elevation, and its Surface provides button
semantics. Native browser controls must preserve keyboard, form, focus, link,
and disabled semantics. The pinned Web shared button supplies the browser
mapping; it does not establish a separate Material design precedence.

**Motion: Compose.** The standard overload retains its specified shape. The
Expressive `ButtonShapes` overload morphs between resting and pressed corner
shapes using `MotionSchemeKeyTokens.DefaultEffects`, deliberately chosen to
avoid bounce. Both pinned schemes use damping 1 and stiffness 1600 for this
effects spring. [`AnimatedShape.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/AnimatedShape.kt)
reverses an interrupted morph by flipping progress and velocity. Incompatible
corner-shape families snap. Button interaction elevation uses
[`Elevation.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/Elevation.kt):
120 ms incoming, 150 ms outgoing, and 120 ms on hover exit; disabling snaps.
The shared [Ripple source decision](family-CM-0023.md) owns press and state-layer
motion underneath Button. The [Button source reference](../button-reference/README.md)
records timed shape and elevation frames, interruption, reversal, watched
normal-speed media, and reduced-motion browser adaptations. The elevation
trace reconstructs the pinned tween specification; it is not Android device
pixel capture or native Button acceptance.

**Browser semantics: Material Web and web standards.** A native React button
can retain the HTML button's keyboard and form behavior; navigation uses a
real link. Browser focus modality, disabled behavior, and activation must be
verified on the rendered native control. The existing Core Button family
contract governs Core compatibility, while the current Material 3 theme
contract governs the native package and tokens.

Compose files are © The Android Open Source Project, Apache-2.0; Material Web
files are © Google LLC, Apache-2.0; the frozen Material Design Kit is ©
Material Design, CC BY 4.0. Preserve attribution and licenses with selected
product assets.
