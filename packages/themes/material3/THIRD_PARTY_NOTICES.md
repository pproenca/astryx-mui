# Third-party Material data

Paths below refer to this package's source tree. `astryx theme add material3`
places the copied source files directly in the generated theme directory; the
same filenames and notices apply there. The gallery font is a repository QA
fixture and is not part of that scaffold.

`src/material3ColorSource.json`, `src/material3TypographySource.json`, and
`src/material3ShapeSource.json`, `src/material3MotionSource.json`, and
`src/material3SpatialSource.json`, and `src/material3ElevationSource.json`
contain palette, color-role, typeface, typescale, tracking, shape, motion,
state, component geometry, and elevation layer
values derived from Google LLC's Material Web
source at commit
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3):

- `tokens/versions/v0_192/_md-ref-palette.scss`
- `tokens/versions/v0_192/_md-sys-color.scss`
- `tokens/_md-ref-palette.scss`
- `tokens/_md-sys-color.scss`
- `tokens/versions/v0_192/_md-ref-typeface.scss`
- `tokens/versions/v0_192/_md-sys-typescale.scss`
- `tokens/_md-ref-typeface.scss`
- `tokens/_md-sys-typescale.scss`
- `tokens/versions/v0_192/_md-sys-shape.scss`
- `tokens/_md-sys-shape.scss`
- `tokens/versions/v0_192/_md-sys-motion.scss`
- `tokens/_md-sys-motion.scss`
- `tokens/versions/v0_192/_md-sys-state.scss`
- `tokens/_md-sys-state.scss`
- `tokens/_md-comp-filled-button.scss`
- `tokens/_md-comp-outlined-button.scss`
- `tokens/_md-comp-text-button.scss`
- `tokens/_md-comp-icon-button.scss`
- `tokens/_md-comp-list-item.scss`
- `tokens/_md-comp-menu-item.scss`
- `tokens/_md-comp-checkbox.scss`
- `tokens/_md-comp-switch.scss`
- `tokens/_md-comp-filled-text-field.scss`
- `tokens/_md-comp-outlined-text-field.scss`
- The matching generated `tokens/versions/v0_192/_md-comp-*.scss` inputs
- `tokens/versions/v0_192/_md-sys-elevation.scss`
- `tokens/_md-sys-elevation.scss`
- `tokens/_md-comp-elevation.scss`
- `elevation/internal/_elevation.scss`
- `tokens/_md-comp-badge.scss`
- `tokens/versions/v0_192/_md-comp-badge.scss`
- `labs/badge/internal/_badge.scss`
- `labs/gb/components/badge/badge.scss`

Copyright 2023 Google LLC. Licensed under the Apache License, Version 2.0.
The license text is included in [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0).

The extraction scripts check the pinned commit and compare every committed
color, typography, shape, motion, state, geometry, and elevation value against
the Sass and browser results. Changes to this data should
name the new upstream commit and retain source and license attribution.

`src/material3IconSource.json` contains SVG path data from Google's official
[Material Symbols repository](https://github.com/google/material-design-icons/tree/bd8cb85bd4bad964fe6918f79665bb40c3a8efef)
at commit `bd8cb85bd4bad964fe6918f79665bb40c3a8efef`. The source files are
the 24px outlined and selected filled SVGs under
`symbols/web/*/materialsymbolsoutlined/`; each entry records its exact source
path and SHA-256. Copyright Google LLC. The repository publishes these icons
under Apache-2.0; the included license text applies. The theme renders the
paths as SVGs and does not redistribute the Material Symbols font binary.

The foundation QA gallery embeds the variable Roboto font at
`scripts/fonts/Roboto-wdth-wght.ttf`, copied from the official
[Google Fonts Roboto source](https://github.com/google/fonts/tree/23e54b51ddffbc7713c583748e3bd86f62b1fa4a/ofl/roboto)
at commit `23e54b51ddffbc7713c583748e3bd86f62b1fa4a` (SHA-256
`d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134`).
Copyright 2011 The Roboto Project Authors. Licensed under the SIL Open Font
License, Version 1.1; the full notice and license are in
[`scripts/fonts/OFL.txt`](scripts/fonts/OFL.txt). The font is a QA fixture,
not a runtime dependency of the published Material 3 theme.
