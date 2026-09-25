# Third-party color data

`src/material3ColorSource.json` contains palette values and light/dark system
color-role mappings derived from Google LLC's Material Web source at commit
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3):

- `tokens/versions/v0_192/_md-ref-palette.scss`
- `tokens/versions/v0_192/_md-sys-color.scss`
- `tokens/_md-ref-palette.scss`
- `tokens/_md-sys-color.scss`

Copyright 2023 Google LLC. Licensed under the Apache License, Version 2.0.
The license text is included in [LICENSE-APACHE-2.0](LICENSE-APACHE-2.0).

The extraction script checks the pinned commit and compares every committed
palette value and light/dark role against the Sass result. Changes to this data
should name the new upstream commit and retain source and license attribution.
