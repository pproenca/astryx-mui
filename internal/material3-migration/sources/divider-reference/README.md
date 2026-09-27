# Static Divider source reference

These seven PNGs are reproducible browser projections of the pinned Compose
`HorizontalDivider`, `VerticalDivider`, and `DividerTokens` values at AndroidX
`a095da93f8e98dea8748ceed79ea8427aade245f`. The source generator checks
the AndroidX file hash and resolves `OutlineVariant` from pinned Compose light
and dark palette tokens. The fixture backgrounds are neutral comparison fields,
not a claim about a component-owned container. The captures are **source
references**, not native Astryx acceptance.

The default occupies 1px across the available width or height at DPR 1.
The 20dp sample translates the pinned custom-thickness behavior. `Dp.Hairline`
occupies zero layout height yet paints a 1px stroke; its PNG matches the default
line at this density, while the source geometry assertion distinguishes them.
The start inset uses the explicit pinned Material Web 16px logical option, not a
Compose default; the RTL image verifies that the gap moves to the physical right.

Pinned Compose has no standalone Divider animation. Motion, interruption,
reversal, and reduced-motion playback are source-backed N/A for this rule.
Animated placement inside another component belongs to that component's source
review. Accessibility and forced-colors behavior follow pinned Material Web and
web standards and require native browser verification.

Regenerate with `M3_ANDROIDX=<pinned checkout> node
internal/material3-migration/sources/divider-reference/generate-divider-reference.mjs`.
Use `--check` to verify byte-for-byte images and the baseline JSON.

The Android Open Source Project Compose and Google LLC Material Web sources are
Apache-2.0. The frozen Material Design Kit is CC BY 4.0. Source attribution and
license notices must remain with any selected product assets.
