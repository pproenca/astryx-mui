# Divider comparison references

These seven PNGs project the pinned AndroidX Compose `HorizontalDivider` and
`VerticalDivider` values into Chrome at a 480 × 240 viewport and DPR 1. The
comparison fields are white or black; they are not component-owned surfaces.
The `inset-start` pair adds the recorded Material Web gap fill: a 16px logical
start inset. Native captures must use the same viewport, density, scheme,
direction, content, and geometry.

The `hairline-light` image matches the 1px default visually at DPR 1, but its
rule must occupy zero layout height. Check geometry separately from pixels.
Standalone Compose Divider has no animated state, so motion is not applicable.

Source selection and exact revisions are recorded in
`internal/material3-migration/sources/baseline/divider-compose-first.json`.
AndroidX Compose and Material Web are licensed under Apache-2.0; see the
package's `THIRD_PARTY_NOTICES.md` and `LICENSE-APACHE-2.0`.
