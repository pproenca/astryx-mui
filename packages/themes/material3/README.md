# Material 3 theme

A Material 3 foundation theme for Astryx, based on pinned Material Web tokens
and official Material Symbols artwork. Existing Astryx component APIs remain
available. Component appearances are being mapped and reviewed individually.

```tsx
import {XDSTheme} from '@astryxdesign/core/theme';
import {material3Theme} from '@astryxdesign/theme-material3/built';
import '@astryxdesign/theme-material3/theme.css';

<XDSTheme theme={material3Theme}>
  <App />
</XDSTheme>;
```

For the source typography metrics, load Roboto weights 400, 500, and 700 in your
app. The theme falls back to Arial and sans-serif when Roboto is unavailable.
Icons are bundled as Material Symbols SVG paths, so no icon font is required.

The bare package path exports the source theme for StyleX compilation. The
`/built` path and `theme.css` provide the prebuilt theme for other setups.

The theme exports light and dark color schemes and source-backed type, shape,
motion, geometry, elevation, and icon helpers. See
[third-party notices](THIRD_PARTY_NOTICES.md) for Google source and license
details.
