# Elevation family source research

This record resolves the source authority for the standalone Material Web
`md-elevation` mapping (`CM-0018`). The owner selected an opt-in decorative
native `Elevation` shadow layer for custom positioned owners on 2026-09-27.
The exact React props still need review. Shadow and tonal depth already appear
in the native foundation; Surface, Button, Card, and other owning components
retain their own state and layer-order comparisons.

## Coverage at pinned revisions

- **Compose:** At AndroidX commit
  [`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f),
  [`Surface.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)
  owns independent `tonalElevation` and `shadowElevation` inputs. Both default
  to zero. Tonal elevation accumulates through nested Surfaces and affects the
  surface color only when its base color is the scheme's surface color; shadow
  elevation draws a shadow without changing z-index. Pinned
  [`ElevationTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt)
  names levels 0–5 at 0, 1, 3, 6, 8, and 12 dp. Compose has no standalone
  public `Elevation` composable. Its
  [internal interaction helper](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/Elevation.kt)
  animates component-owned press, drag, hover, and focus elevation; it is not a
  generic Surface animation default.
- **Figma:** The frozen 171-set inventory at SHA-256
  `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac08035f9e468` contains no
  standalone Elevation component set. It does contain ten published effect
  styles, `M3/Elevation Light/1–5` and `M3/Elevation Dark/1–5`, plus elevation
  axes within other component sets. The ten styles fill the CSS shadow-pixel
  gap in Compose and are tested against the pinned Web shadow values. They
  remain style evidence and parent-component scope, not a standalone elevation
  component.
- **Material Web:** At commit
  [`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
  [`md-elevation`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/elevation/internal/elevation.ts)
  renders an `aria-hidden` shadow layer. The
  [component guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/elevation.md)
  says that it fills the nearest positioned owner, uses
  `--md-elevation-level` 0–5 and `--md-elevation-shadow-color`, and is
  decorative. Its [style source](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/elevation/internal/_elevation.scss)
  draws separate key and ambient shadows. The guide's 250 ms animation is an
  author-selected example using inherited transition properties, not a
  component default.

## Source boundary for the next decision

Compose governs the native levels, separate tonal and shadow inputs, nested
tonal accumulation, and any component-owned elevation state motion. Compose
does not specify CSS key and ambient shadow coordinates; the ten pinned Figma
effect styles fill that design gap, and Material Web supplies the browser CSS
layer implementation and decorative, `aria-hidden` attachment. No standalone
Surface elevation animation is specified: the Web guide's 250 ms transition is
an author-selected example, so source motion for a static standalone shadow
is N/A. Component-owned interaction motion remains required in each component
family. The pinned Web element's existence alone does not determine a React
public export. The owner selected a separate decorative shadow layer for
custom controls, while native Surface and controls will own tonal elevation,
their state transitions, and their interaction motion. This boundary does not
turn Compose's internal interaction helper or the Web guide's example timing
into a default for the standalone layer.

The Android Open Source Project Compose and Google LLC Material Web files are
Apache-2.0. The frozen Material Design Kit is CC BY 4.0. Preserve source
attribution if selected values become product assets.
