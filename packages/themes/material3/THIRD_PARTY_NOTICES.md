# Third-party Material data

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

Copyright 2023 Google LLC. Licensed under the Apache License, Version 2.0.
The license text is included in [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0).

The extraction scripts check the pinned commit and compare every committed
color, typography, shape, motion, state, geometry, and elevation value against
the Sass and browser results. Changes to this data should
name the new upstream commit and retain source and license attribution.
