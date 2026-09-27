# Filled and outlined text field family source research

This shared decision covers `CM-0021`, `CM-0022`, `CM-0053`, and `CM-0054`:
Material Web's filled/outlined field shells and its filled/outlined text-field
controls. It resolves source authority once for the family. It does not decide
whether a decorative field shell deserves a separate public React export;
that ownership and the exact native input API require review before implementation.

## Pinned coverage and boundary

- **Compose:** At AndroidX commit
  [`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f),
  [`TextField.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TextField.kt)
  and [`OutlinedTextField.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/OutlinedTextField.kt)
  own the filled and outlined editable controls. The public
  [`TextFieldDefaults.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TextFieldDefaults.kt)
  exposes filled `Container`/`DecorationBox`/`decorator` helpers and corresponding
  outlined helpers for decoration around an independently owned input. Those
  helpers justify a shared internal recipe; they do not establish a separate
  public shell API. Both editable defaults set a 56 dp minimum height and 280 dp
  minimum width subject to parent constraints. Filled uses an inside label and
  a bottom indicator; outlined defaults to a cutout label and a perimeter
  outline. Focus changes the stroke from 1 to 2 dp. The generated
  [`FilledTextFieldTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/FilledTextFieldTokens.kt)
  and [`OutlinedTextFieldTokens.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/OutlinedTextFieldTokens.kt)
  define the style-specific colors, type, shape, icons, error, disabled, hover,
  and focus roles. No Core TextInput geometry substitutes for these defaults.
- **Figma:** The frozen Material Design Kit inventory at SHA-256
  `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468` contains the
  `Text field` component set, node `52798:24373`, with 120 variants. Its axes
  are leading icon, state (enabled, hovered, focused, error, disabled), style
  (filled, outlined), text configuration (input, label, placeholder), and
  trailing icon; `Show supporting text` is also listed as a property.
  [`compose-spacing-density.md`](../compose-spacing-density.md) establishes
  that the frozen inventory does not expose exact padding for this set. These
  variant names confirm coverage, not a different spacing or motion value.
  There is no selected Figma dimension override in this decision.
- **Material Web:** At commit
  [`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
  [`md-filled-field`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/field/filled-field.ts)
  and [`md-outlined-field`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/field/outlined-field.ts)
  are field-shell elements. The matching
  [filled](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/textfield/filled-text-field.ts)
  and [outlined](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/textfield/outlined-text-field.ts)
  text-field elements import those shells and select them as their `fieldTag`.
  The [shared text-field implementation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/textfield/internal/text-field.ts)
  owns a native input/textarea and its form, value, focus, keyboard, validity,
  and accessibility bridge. Native web input semantics govern the browser
  contract; the Web element's four exports do not require four public React
  components.

## Motion selected from Compose

Pinned [`TextFieldImpl.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/TextFieldImpl.kt)
defines three input phases: focused, unfocused/empty, and unfocused/nonempty.
The label position uses `FastSpatial`; label color, affixes, and indicator
color use `FastEffects`; indicator thickness uses `FastSpatial`. Placeholder
opacity uses `FastEffects` on focused-to-unfocused/empty and `SlowEffects` on
unfocused/empty-to-focused or unfocused/nonempty-to-unfocused/empty. Disabled
indicator color and thickness snap. These are state-dependent motion rules,
not a generic CSS duration. The pinned standard scheme has fast spatial
damping/stiffness 0.9/1400, fast effects 1/3800, and slow effects 1/800;
Expressive changes fast spatial to 0.6/800 while retaining those effects
values. The [pinned Kotlin probe and watched browser playback](../field-reference/README.md)
capture the four scalar paths with 20 ms intermediate samples, interruption,
reversal, and a separate browser reduced-motion adaptation. They establish
source motion, while native behavior and pixel QA remain pending.

The pinned [`TextFieldTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/TextFieldTest.kt)
and [`OutlinedTextFieldTest.kt`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/androidDeviceTest/kotlin/androidx/compose/material3/OutlinedTextFieldTest.kt)
cover default dimensions, surface focus, label/placeholder movement, adornment
placement, error and supporting text, and editing semantics. Select concrete
test methods for each native slice and pair them with browser tests.

Compose files are © The Android Open Source Project, Apache-2.0; Material Web
files are © Google LLC, Apache-2.0; the frozen Material Design Kit is ©
Material Design, CC BY 4.0. Retain attribution with any selected product asset.
