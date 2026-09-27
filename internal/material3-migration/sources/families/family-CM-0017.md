# Divider family source resolution

This record resolves the standalone `md-divider` candidate (`CM-0017`) for the
pinned native migration. Divider rules embedded in list items, menus or other
components remain part of those components' comparisons. Existing Core Divider
labels, strong rules and separator defaults stay in the compatibility surface.

## Coverage lookup

- **Compose present.** At AndroidX commit
  `a095da93f8e98dea8748ceed79ea8427aade245f`,
  [`Divider.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Divider.kt)
  provides `HorizontalDivider` and `VerticalDivider`. Its deprecated `Divider`
  name delegates to a horizontal rule. The pinned
  [`DividerTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/DividerTokens.kt)
  selects `OutlineVariant` and 1 dp. The pinned
  [behavior tests](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/DividerTest.kt)
  cover both orientations, custom thickness, padding and hairline layout;
  [screenshots](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/DividerScreenshotTest.kt)
  cover light, dark, vertical and hairline examples.
- **Figma standalone set absent.** The frozen
  [171-set inventory](../figma-kit-inventory.json), SHA-256
  `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`,
  has no component set named Divider. Several list, menu and field sets expose
  a "Show divider" composition property; their divider placement remains in
  the owning component's Figma scope. Absence here is limited to a standalone
  Divider set.
- **Material Web present.** At commit
  `cbd34a8921915af94d5ef65c2a69eece41d5b4f3`,
  [`md-divider`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/divider/divider.ts)
  is a horizontal custom element. Its
  [implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/divider/internal/divider.ts)
  exposes `inset`, `inset-start` and `inset-end`. The pinned
  [style source](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/divider/internal/_divider.scss)
  uses logical 16px insets and `CanvasText` in forced colors. The pinned
  [component guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/divider.md)
  names supported `--md-divider-color` and `--md-divider-thickness` tokens,
  with `--md-sys-color-outline-variant` and 1px defaults. It describes a
  decorative default and an explicit `role="separator"` for meaningful rules.

## Selected concerns

**Design and defaults: Compose.** The standalone default is a full-width
horizontal rule or full-height vertical rule, 1 dp thick, colored with the
current scheme's `OutlineVariant`. Thickness and color are optional inputs.
`Dp.Hairline` has special rendering: the pinned horizontal Canvas reports zero
layout height in its test while drawing a hairline stroke. A browser translation
must compare both the occupied layout space and visible line at matched density;
it cannot infer that a normal 1px border is equivalent to that special case.

**Behavior: Compose.** The divider groups content visually; it is not
interactive and owns no click, keyboard or selection state. Pinned tests cover
orientation, custom thickness and caller-supplied padding. An inset belongs to
the rule's layout, not to a change in the neighboring component's state.

**Motion: static at this family boundary.** `Divider.kt` draws the current
color and geometry without a transition or animation spec. There is no default
enter, exit, interruption or reversal to replay for the standalone rule. A
containing component's animated divider or layout change must resolve and watch
its own motion source.

**Browser semantics: pinned Web plus native standards.** A visual rule is
decorative by default; meaningful structure may use a separator role and
orientation. The native implementation should expose supported Material token
names directly, respect logical insets and forced colors, and avoid accidental
focus or action semantics. The Web element's horizontal-only DOM is not a reason
to omit Compose's vertical variant.

**Optional fixed inset gap.** Compose accepts caller layout modifiers but does
not prescribe a named `inset` variant or fixed inset distance. The pinned Web
source supplies the optional equal/start/end 16px logical inset presentation.
This fills an unspecified variant; it does not change the Compose full-width
default. A native comparison must name whether this optional variant is selected.

Google LLC Material Web and The Android Open Source Project Compose sources
are Apache-2.0. The frozen Material Design Kit is CC BY 4.0. Preserve their
attribution and license notices with any selected implementation assets.
