# Third-party Material data

`src/material3ColorSource.json` and `src/material3TypographySource.json` contain
palette, color-role, typeface, typescale, and tracking values derived from Google
LLC's Material Web source at commit
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3):

- `tokens/versions/v0_192/_md-ref-palette.scss`
- `tokens/versions/v0_192/_md-sys-color.scss`
- `tokens/_md-ref-palette.scss`
- `tokens/_md-sys-color.scss`
- `tokens/versions/v0_192/_md-ref-typeface.scss`
- `tokens/versions/v0_192/_md-sys-typescale.scss`
- `tokens/_md-ref-typeface.scss`
- `tokens/_md-sys-typescale.scss`

Copyright 2023 Google LLC. Licensed under the Apache License, Version 2.0.
The license text is included in [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0).

The extraction scripts check the pinned commit and compare every committed
color and typography value against the Sass result. Changes to this data should
name the new upstream commit and retain source and license attribution.
