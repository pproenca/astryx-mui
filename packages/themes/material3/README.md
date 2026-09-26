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
Core `Icon` uses bundled Material Symbols SVG paths, so it needs no icon font.
For an arbitrary Material Symbols ligature or codepoint, use the opt-in
`MaterialSymbol` component. Import its stylesheet and load the chosen font
family in your app; the package does not ship a font binary.

```tsx
import {MaterialSymbol} from '@astryxdesign/theme-material3/MaterialSymbol';
import '@astryxdesign/theme-material3/material-symbol.css';

// Load Material Symbols Outlined in your app's font setup.
<MaterialSymbol name="settings" label="Settings" />;
<MaterialSymbol name="home" variant="rounded" fill={1} weight={500} />;
```

The default square is `--md-icon-size` or 24px. Set `size` for an exact
pixel size. `variant` chooses Outlined, Rounded, or Sharp; load each family
you use. `fill` (0–1), `weight` (100–700), `grade` (−50–200), and
`opticalSize` (20–48) set the corresponding variable-font axes. A labelled
standalone symbol has `role="img"` and an accessible name; an unlabelled one
is decorative. The font must include the requested glyph and axis values.

## Divider

Core `Divider` uses the Material 3 theme's outline-variant color and 1px
thickness. Its default separator semantics stay intact. For Material Web's
decorative `md-divider` behavior, set `isDecorative`; add `inset="both"`,
`inset="start"`, or `inset="end"` for the source's 16px logical inset.
The inset follows text direction in RTL layouts. Omit `inset` for a full-width
rule. Use the existing `label`, `variant="strong"`, or vertical orientation
when an Astryx-specific extension is needed.

```tsx
import {Divider} from '@astryxdesign/core/Divider';

<Divider isDecorative inset="start" />;
<Divider aria-label="Results" />;
```

The component mapping exposes `--md-divider-color` and
`--md-divider-thickness` as theme-local roles. A theme override can also set
`--astryx-divider-inset` for the inset distance.

## Material Badge

`MaterialBadge` is an opt-in Material 3 notification surface. It is a 6px dot
without a value and a 16px minimum pill when given a short value such as `3`
or `99+`. It follows the Material Web Labs badge source, so this is Labs
parity, not a stable Material Web component. Core `Badge` remains the Astryx
status and category label.

```tsx
import {MaterialBadge} from '@astryxdesign/theme-material3/MaterialBadge';
import '@astryxdesign/theme-material3/material-badge.css';

<MaterialBadge />;
<MaterialBadge value={3} />;
<MaterialBadge value="99+" label="More than 99 notifications" />;
```

Place the badge over its owner with CSS using a positioned parent and logical
inset properties so it follows RTL. The badge has no click target and does not
intercept pointer input. By default it is hidden from assistive technology;
when it augments a button, include the notification state in the button's
accessible name. Use `label` for a meaningful standalone badge. The local
`--md-badge-*` roles allow Material-specific color, size, shape, and type
overrides.

Use Core's semantic tokens in app styles so other Astryx themes keep working.
The Material 3 theme-local roles are intended for Material-specific component
overrides. The source [theme contract](material3.spec.md) describes that
boundary, and the [third-party notices](THIRD_PARTY_NOTICES.md) identify the
Google sources and licenses.
