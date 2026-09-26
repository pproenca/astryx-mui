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

The frozen Material Design kit supplies 32 named and contrast color modes as
Figma-only scope. Material Design Kit by Google, licensed CC BY 4.0. Its
recorded source hash is
`64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`.
Reference captures and the independent Kotlin spring traces under
`fixtures/references/` retain the selected source provenance in their
manifests. No font binary is duplicated here: typography
tests reuse the pinned Roboto fixture and OFL license in
`packages/themes/material3/scripts/fonts/`. Existing Meta and Google notices
in `@astryxdesign/theme-material3` remain with that compatibility package.
