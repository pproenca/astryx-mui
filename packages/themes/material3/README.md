# Material 3 theme

`@astryxdesign/theme-material3` provides light and dark Material 3 foundation
roles for Astryx. Its colors, typography, shapes, motion, elevation, and icons
come from pinned Material Web and Material Symbols sources. The package is in
this repository's workspace; it has not yet been released to npm.

The theme is additive: it preserves Astryx Core token names and component APIs.
Component appearances are being migrated and reviewed individually, so using
this theme does not by itself make Core components Material 3 components.

## Use the built theme

When the package is installed in your workspace, import its built theme and
stylesheet together. The stylesheet supplies the first paint without waiting
for runtime style injection.

```tsx
import {Theme} from '@astryxdesign/core/theme';
import {material3Theme} from '@astryxdesign/theme-material3/built';
import '@astryxdesign/theme-material3/theme.css';

<Theme theme={material3Theme} mode="system">
  <App />
</Theme>;
```

`mode="system"` follows the user's color scheme. Use `mode="light"` or
`mode="dark"` when your app controls the mode. The bare package path exports the
source theme for setups that compile StyleX or inject theme styles at runtime:

```tsx
import {Theme} from '@astryxdesign/core/theme';
import {material3Theme} from '@astryxdesign/theme-material3';

<Theme theme={material3Theme}>
  <App />
</Theme>;
```

Load Roboto weights 400, 500, and 700 in your app for the source typography
appearance. The theme falls back to Arial and sans-serif when Roboto is absent;
the comparison gallery's licensed font is not included in the runtime package.
Icons use bundled Material Symbols SVG paths, so no icon font is required.

Use Core's semantic tokens in app styles so other Astryx themes keep working.
The Material 3 theme-local roles are intended for Material-specific component
overrides. The source [theme contract](material3.spec.md) describes that
boundary, and the [third-party notices](THIRD_PARTY_NOTICES.md) identify the
Google sources and licenses.
