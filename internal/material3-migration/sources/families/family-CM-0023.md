# Ripple and focus indication source resolution

This shared source decision covers workbook mappings `CM-0023` (`md-focus-ring`)
and `CM-0042` (`md-ripple`). Both use the pinned Compose `Ripple` indication;
the workbook links that one source family while retaining two native outcomes
and distinct acceptance checks. It separates the focus indication used by
native Material controls from the pinned Web-only attached ring presentation.
The project owner selected opt-in public `FocusRing` and `Ripple` visual
primitives for custom controls on 2026-09-27. Native Material controls still
own their default indications. Each public React API needs its component
contract; the source decision alone does not settle its props.

## Pinned coverage

- **Compose present for both mappings.** Pinned
  AndroidX commit `a095da93f8e98dea8748ceed79ea8427aade245f` supplies focus
  indication through [`Ripple.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Ripple.kt)
  (SHA-256 `4b53b7ffb01ff48014cdc2f6af216c97f6463d5e25343d9db699ea4abb90bc00`).
  Its default theme uses an opacity indication; an explicit theme configuration
  selects the inset focus ring. The
  [ripple node](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/Ripple.kt)
  (SHA-256 `f0ba3e8b3d5b40d3977f7e4dcbf2c93dec02e19705a1141f8efe6dc81c2f0aa7`)
  draws it. The [pinned tests](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/RippleTest.kt)
  cover focus state-layer paint, two-stroke inset geometry, theme default
  colors and custom colors. Several owning control screenshot suites cover the
  inset option. The
  [press animation](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/RippleAnimation.kt)
  and [bounded/unbounded node](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/CommonRipple.kt)
  provide the common press indication. These are one shared indication, not
  standalone Compose widgets.
- **Figma standalone sets absent.** The [frozen inventory](../figma-kit-inventory.json)
  contains 171 component sets; none has `focus`, `ring` or `ripple` in its name. Eighty-two
  owning sets carry a `Show focus indicator` property. Their focused variants
  remain with their Button, Card, input and other component families. This
  absence is limited to standalone Figma sets.
- **Material Web present.** Pinned commit
  `cbd34a8921915af94d5ef65c2a69eece41d5b4f3` registers
  [`md-focus-ring`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/focus/md-focus-ring.ts).
  Its [element](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/focus/internal/focus-ring.ts)
  can attach to a parent, referenced control or imperative control, tracks
  `:focus-visible`, suppresses the ring after pointerdown and keeps itself
  `aria-hidden`. The [styles](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/focus/internal/_focus-ring.scss)
  and [tokens](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/tokens/_md-comp-focus-ring.scss)
  provide an outward default, inward alternative, 3px resting width, 8px
  active width, secondary color, 2px outward offset, and reduced-motion rule.
  Those values are Web-only presentation values, not Compose defaults.
  The separate pinned
  [`md-ripple`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/ripple/ripple.ts)
  wrapper and [implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/ripple/internal/ripple.ts)
  attach a visual-only state layer to a parent, referenced control or
  imperative control. Its [guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/ripple.md)
  shows bounded and unbounded presentations and the supported hover/pressed
  color tokens. Web uses a 150ms touch delay to distinguish scroll from press;
  that timing is not a Compose press default.

## Shared Ripple design and behavior

`ripple()` is the Compose default indication in Material controls. It starts a
new expanding ripple for each press and shows one state layer for hover,
focus or drag, based on the most recent active interaction. The default is
bounded to the owner's layout, starts at the press point and clips there. An
explicit unbounded ripple starts at the owner's center. The source color
defaults to `LocalContentColor`; optional radius and color can be supplied.
The state layer opacities are hover 0.08, focus 0.10, press 0.10 and drag 0.16.
Disabled or explicitly suppressed indications must not render. The
[`RippleAnimationTest`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3-ripple/src/androidHostTest/kotlin/androidx/compose/material3/ripple/RippleAnimationTest.kt)
proves the 30%-of-largest-dimension start radius and the half-diagonal end
radius, plus 10dp for a bounded ripple. The originating control owns action,
focus, accessible name and target size; the indication is visual-only.

The Compose press animation uses a 75ms linear opacity fade in, 225ms
FastOutSlowIn radius expansion, 225ms linear movement toward center, and
150ms linear fade out after release. An early release waits for the full
fade-in before exiting, while its draw path reaches final alpha immediately;
another press finishes the prior ripple. Hover state-layer entry and exit use
15ms linear tweens; focus and drag enter at 45ms; drag exits at 150ms. These
are the pinned common Ripple implementation values for both standard and
Expressive themes, rather than a new Expressive-only press duration.

Material Web supplies DOM attachment, pointer event and forced-colors
implementation details. Its 150ms touch delay and 450ms press growth are
different interaction/motion values; they cannot silently replace Compose's
specified press behavior. A native browser implementation must cancel on
pointer cancellation/scroll and prevent a stale release from ending a newer
press without adopting those conflicting values. If that browser translation
cannot preserve usable touch scrolling with Compose timing, record and seek a
specific exception before implementation.

## Selected focus design, state and browser behavior

**Compose default.** The focus state layer uses the current content/ripple
color at `StateTokens.FocusStateLayerOpacity = 0.1`. The default ring is absent.
Opting into `RippleDefaults.InsetFocusRingThemeConfiguration` draws two strokes
following the owning shape: outer inset 0dp and width 2dp; inner inset 1dp and
width 3dp. The outer color defaults to `colorScheme.secondary` and the inner
to `colorScheme.onSecondary`, with per-ripple color overrides. An owner must not
accidentally show both the opacity layer and inset ring for the same focus move.

**Web attachment gap.** Compose has no DOM owner, `htmlFor` or `:focus-visible`
heuristic. The pinned Web element and native browser behavior supply attachment,
focus/pointer visibility and decorative accessibility. The current
[`architecture:interaction-modality`](../../../../docs/architecture/interaction-modality.md)
record additionally governs programmatic focus and ensures one visible
indicator owned by the focused control or its proxy. The ring itself is not an
interactive target, content slot or accessible control. The owning component
must preserve its own semantic focus and shape, including RTL, overflow and
forced-colors cases.

**Optional outward presentation gap.** Compose's optional ring is inset; it
does not specify an outward attached ring. If the native package exposes the
Web-only outward presentation, select it explicitly and use the pinned Web
geometry and `--md-focus-ring-*` public CSS spellings for that presentation.
The outward choice cannot replace native controls' Compose default. Compose's
two-color inset geometry needs private, attributed implementation values unless
a supported public Material token supplies a matching value; do not invent a
public `--md-*` token. The selected public React `FocusRing` needs a reviewed
exact API under `architecture:public-component-api`.

## Watched Ripple media

The pinned [Web usage GIF](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/images/ripple/usage.gif)
(SHA-256 `e19d538fb1d1f06b0ced140d83abe95632224e569429bb53a2bfb53c7fecb155`)
was watched at normal browser playback and decoded at 0, 100, 300, 400, 500,
600, 700, 800, 900 and 1000ms. Its circle is absent at 0–100ms, appears soft
at 300ms, covers the bounded surface at 400ms, holds through 600ms and fades
by 800ms. It is absent again by 900ms. This is a Web motion reference, not
the Compose timing baseline. The Compose code above supplies the press motion
curve and interruption rule; native verification still needs matched frames,
rapid repeated presses, release/cancel and reduced-motion capture. Reduced
motion must retain an immediate perceivable press state without travel.

## Watched motion and remaining implementation evidence

The pinned [usage GIF](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/images/focus/usage.gif)
(SHA-256 `78356c1d36755b0b356772f069ba97717452149f20f0c6a5ddd16cc3cbcae2d0`)
was watched at normal browser playback and as decoded intermediate frames.
The outline grows thick on keyboard focus, contracts to a thin held border and
disappears after blur. The pinned
[inward GIF](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/images/focus/usage-inward.gif)
(SHA-256 `d684510222d69b2118eb0581964e215877478e2f6a2883e1c24ae49419afb923`)
shows the corresponding inset Web border. These GIFs do not demonstrate a
mid-flight interruption or Compose's two-stroke spring.

Decoded 25fps frames from the Web usage clip show the first focus entry at
700ms, a thick outward peak at 800ms, contraction at 900–1000ms and the held
thin ring by 1200ms. The held ring is still present at 3000ms; the indicator
is gone at 3700ms and remains absent at 4000–4300ms. The inward clip shows
the thick border at 700ms, contraction by 800–1000ms and a held border at
1300ms; its final decoded 2100ms frame is unfocused. The clip timelines
include initial and held pauses, so the absolute GIF time is not the focus
animation duration. These observations describe Web media only.

For the Compose inset option, the pinned `Ripple.kt` selects
`motionScheme.fastSpatialSpec<Float>()` on focus and
`fastEffectsSpec<Float>()` on unfocus. The node animates one interpolation from
its current value to 1 or 0; both stroke widths and insets multiply by that
interpolation. The existing [upstream spring probes](../motion/upstream/README.md)
execute the pinned Kotlin spring source, including retargeting at 120ms and
reversal at 260ms, for standard and Expressive fast spatial/effects specs.
They provide intermediate position and velocity references, but their generic
target sequence is not a rendered focus-ring recording. For example, the
standard fast-spatial probe reaches 17.959%, 84.754% and 97.300% of its first
target at 20ms, 80ms and 120ms; Expressive reaches 12.594%, 87.356% and
107.834%, showing overshoot. At 260ms, after the probe's intermediate
retarget, the respective interpolations are 40.525% and 33.554%. Both
fast-effects probes agree and reach 34.922%, 95.720% and 99.493% at 20ms,
80ms and 120ms. These percentages are the normalized generic Kotlin probe
values, not measured border pixels. Native comparison must
exercise actual focus, blur, rapid refocus, pointer interruption and reduced
motion at matched size, density, shape, scheme and colors; capture aligned
frames and a normal-speed clip before verification. The pinned Web Sass disables
its animation under `prefers-reduced-motion`. The web translation must preserve
an immediately visible focus indicator there; no Compose reduced-motion default
is inferred from the source GIF.

The Android Open Source Project and Google LLC sources are Apache-2.0. The
frozen Material Design Kit is CC BY 4.0. Preserve attribution and licenses
with any translated code, media or assets.
