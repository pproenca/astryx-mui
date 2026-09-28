# Third-party Material foundation data

`src/tokens.ts` lists CSS-backed Material role names from Google LLC's Material
Web source at commit
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3),
including active `_md-sys-color.scss`, `_md-sys-typescale.scss`,
`_md-sys-shape.scss`, `_md-ref-typeface.scss`, `_md-comp-divider.scss`, and
`_md-comp-badge.scss` wrappers and their `v0_192` inputs. Copyright 2023 Google
LLC. Licensed under Apache-2.0; see `LICENSE-APACHE-2.0`.

`src/foundationSource.json` contains palette, light/dark and Expressive role
bindings, type metrics, corner and Expressive shape geometry, elevation,
state, spring inputs, and component geometry derived from the pinned AndroidX
Compose Material 3 checkout at
[`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f).
Copyright The Android Open Source Project and Google LLC. Licensed under
Apache-2.0; see `LICENSE-APACHE-2.0`. The source file records hashes for its
inputs. Material Web at the commit above supplies supported browser CSS names
and the documented shadow gap.

`src/Elevation/Elevation.tsx` renders two decorative shadow layers using
the six pinned Compose levels and the Material Web key and ambient CSS geometry
recorded in `src/foundationSource.json`. The frozen Figma light/dark effect
styles fill the browser pixel gap. Google LLC and The Android Open Source
Project source data retain their Apache-2.0 attribution above; the frozen
Material Design Kit is CC BY 4.0 as recorded below.

The frozen Material Design kit supplies 32 named and contrast color modes as
Figma-only scope. Material Design Kit by Google, licensed CC BY 4.0. Its
recorded source hash is
`64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`.
Reference captures and the independent Kotlin spring traces under
`fixtures/references/` retain the selected source provenance in their
manifests. The native foundation gallery carries representative source, native
and difference captures under `gallery/evidence/`, with their source revision
and hashes in its manifest. Its pinned Roboto font is copied into
`fixtures/fonts/` with the SIL Open Font License in `OFL.txt`; the same licensed
font is used for the gallery's browser typography comparison. Existing Meta and
Google notices in `@astryxdesign/theme-material3` remain with that
compatibility package.

The native `Icon` gallery's close, check and search SVG paths derive from
Google LLC's Material Symbols Outlined artwork at commit
[`bd8cb85bd4bad964fe6918f79665bb40c3a8efef`](https://github.com/google/material-design-icons/tree/bd8cb85bd4bad964fe6918f79665bb40c3a8efef).
Copyright Google LLC, licensed Apache-2.0. `MaterialSymbol` supports the
corresponding font presentation channel, but no Material Symbols font binary is
redistributed. Pinned, licensed font files are used only in the ignored local
QA build when `M3_ICON_FONT_CACHE` is set.

`src/FocusRing/FocusRing.tsx` selects optional inset focus indication and fast
spatial/effects spring inputs from the pinned AndroidX Compose `Ripple.kt` and
`MotionScheme.kt` sources above. Its explicit outward geometry and 600 ms
grow/shrink presentation derive from the pinned Material Web `focus/` source
at the Web commit above. The retained light/dark focus frames and Kotlin motion
traces under `fixtures/references/focus/` carry their source revisions and
Apache-2.0 attribution in that directory's README. The local comparison uses
the licensed Roboto fixture and its SIL Open Font License.

`src/Ripple/Ripple.tsx` derives press geometry, state opacities and animation
timings from the pinned AndroidX Compose `Ripple.kt`, `CommonRipple.kt`,
`RippleAnimation.kt` and `RippleAnimationTest.kt` sources above. Copyright The
Android Open Source Project and Google LLC, licensed Apache-2.0. The retained
source frames, traces and watched media under
`internal/material3-migration/sources/ripple-reference/` record the pinned
revision and capture method. The native implementation and browser integration
are Copyright Meta Platforms, Inc. and affiliates.

`fixtures/references/divider/` contains browser projections of the pinned
AndroidX Compose `Divider.kt` and `DividerTokens.kt` geometry and color values.
The optional 16px logical inset follows the pinned Material Web divider source
above. Copyright The Android Open Source Project and Google LLC, licensed
Apache-2.0. The native React implementation and browser comparison are Copyright
Meta Platforms, Inc. and affiliates.
