# Native Material 3 package

`@astryxdesign/material3` is the native Material 3 package boundary. It is
private while its foundation gallery and components are being migrated. The
entry point now exposes the canonical Compose-first foundation graph, typed
CSS-backed Material roles, source-only values, native presentational Icon and
MaterialSymbol components, the opt-in FocusRing and Ripple primitives, and
native HorizontalDivider and VerticalDivider. Other components remain in
migration.

```ts
import {material3Var, resolveMaterial3Token} from '@astryxdesign/material3';

const foreground = material3Var('--md-sys-color-on-surface');
const lightForeground = resolveMaterial3Token('--md-sys-color-on-surface');
```

The supported names reflect the pinned Material Web CSS wrappers at
[`cbd34a8921915af94d5ef65c2a69eece41d5b4f3`](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3).
The migration's design, behavior, and motion decisions follow pinned AndroidX
Compose Material 3 at
[`a095da93f8e98dea8748ceed79ea8427aade245f`](https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f).
CSS names are a browser interface, not evidence that Material Web determines
overlapping native design. Source-only palette, geometry, spring inputs,
emphasized typography, and tracking values are deliberately absent from the
public CSS token type. `tokens.css` emits the supported system roles for light,
dark, Expressive light, and the Figma-only kit modes. Component token defaults
are declared at each native component host so scoped system overrides resolve
through the browser cascade. A `web-compat` profile preserves the released
Core bridge's full-corner CSS value while the native profile uses `50%`.

## Discovery

`astryx.integration.mjs` locates `docs/` and `src/`. The native reference and
each component own strongly typed, same-stem `.doc.mjs` descriptors. There is
no central item catalog or per-item manifest map.

## Native icons

```tsx
import {Icon} from '@astryxdesign/material3/Icon';
import {MaterialSymbol} from '@astryxdesign/material3/MaterialSymbol';
import '@astryxdesign/material3/tokens.css';
import '@astryxdesign/material3/components.css';

<Icon icon={CheckSvg} label="Completed" />;
<MaterialSymbol name="check" variant="rounded" fill={1} label="Completed" />;
```

`Icon` renders consumer-supplied SVG artwork, inherits text color, and uses
`--md-icon-size` or 24px when the SVG has no declared `intrinsicSize`. Pass
intrinsic width and height for vectors with their own dimensions; an explicit
square `size` wins. The SVG needs a `viewBox` and should use `currentColor` for
theme tint. `MaterialSymbol` accepts a
ligature or codepoint, Outlined/Rounded/Sharp family, and FILL, wght, GRAD and
opsz axes. The app loads its selected Material Symbols font and glyph coverage;
Astryx does not redistribute those font binaries. Both components are
decorative by default. A meaningful standalone glyph needs `label`; an
interactive action belongs in a labelled control that owns its focus target,
states and motion.

## Native FocusRing

```tsx
import {FocusRing} from '@astryxdesign/material3/FocusRing';
import '@astryxdesign/material3/tokens.css';
import '@astryxdesign/material3/components.css';

<button className="positioned-control" type="button">
  Save
  <FocusRing placement="inset" />
</button>;
```

`FocusRing` is an opt-in visual indicator for custom controls. Its direct
visual parent must be positioned and owns the accessible name, focusability,
activation, target size, and disabled state. Choose `inset` for the pinned
Compose two-stroke ring, or `outward` for the separately selected Material Web
ring. Outward placement needs an unclipped parent and ancestor chain. A control
with a distinct hidden input passes that input's `controlRef`; the ring still
paints on its direct visual parent. The ring itself never takes focus or
pointer events. Native Material controls retain their Compose focus-state
opacity by default; adding this primitive is a deliberate component choice.

## Native Ripple

```tsx
import {Ripple} from '@astryxdesign/material3/Ripple';
import '@astryxdesign/material3/tokens.css';
import '@astryxdesign/material3/components.css';

<button className="positioned-control" type="button">
  Save
  <Ripple />
</button>;
```

`Ripple` is an opt-in decorative indication for a custom control. Its direct
visual parent supplies the accessible name, focus indicator, activation,
disabled behavior, target size and form semantics. The default press clips to
the parent's shape and begins at the pointer position. `unbounded` starts from
the center and needs an unclipped parent and ancestor chain. Pass `controlRef`
for a distinct semantic input, and `dragged` for a drag state owned by the
control. Light, dark and Expressive color follows the Material tokens and the
parent's content color. The indication does not intercept pointer or keyboard
events. Native Material controls will own their own indication.

## Native Divider

```tsx
import {
  HorizontalDivider,
  VerticalDivider,
} from '@astryxdesign/material3/Divider';
import '@astryxdesign/material3/tokens.css';
import '@astryxdesign/material3/components.css';

<HorizontalDivider inset="start" />;
<VerticalDivider role="separator" />;
```

The two Compose-named rules use OutlineVariant and 1 CSS pixel by default.
Optional `thickness` accepts a positive CSS-pixel number or `"hairline"`, which
occupies zero layout extent and paints one device pixel. `color` accepts a CSS
color. Horizontal `inset` adds a 16px logical gap on `both`, `start`, or `end`;
vertical rules have no inset. Both rules are decorative by default. Use
`role="separator"` only when the boundary conveys structure. The container
supplies a vertical rule's height. Core Divider remains a separate compatibility
API for labels, strong treatment, and its existing semantic default.

## Compatibility direction

The canonical value graph flows from Material reference and system roles to
Material component roles. Native components consume those Material roles
directly. The existing `@astryxdesign/theme-material3` package remains a
separate Core compatibility entry point: its portable `--color-*`, `--text-*`,
`--radius-*`, and other aliases reference canonical Material roles in one
direction. Native code does not import that package or depend on its aliases.
The published Core bridge bundles the native graph at build time, so its
released entry point does not require this private package at runtime.

Replacement imports will be published per component only after native
verification. A themed `@astryxdesign/core/Button` consumer, for example, will
move to `@astryxdesign/material3/Button` when that native pilot is released.
Core consumers can continue using `@astryxdesign/theme-material3`; its current
exports remain available. The existing
`@astryxdesign/theme-material3/MaterialSymbol` path delegates to the native
component and retains its released source and built API. Other theme entry
points remain compatibility surfaces until their native replacements pass
review.

No released API is removed in this package slice. Removal requires an inventory
of affected consumer imports, published replacement paths, tested codemods,
compatibility and native regression evidence, deprecation notice, and an
explicitly approved major-release decision. The migration workbook owns task
order and acceptance; this section records the public compatibility boundary.

## Foundation fixtures

Open `fixtures/native-token.html` to exercise scoped Material variable
overrides. Its deliberately distinct probe colors are structural test inputs,
not a Material visual baseline. `pnpm build` and `pnpm test` check the emitted
package, role-name inventory, Chrome computed styles, and exact light/dark
reference comparisons for color, typography, corners, Expressive shapes,
spacing/density, tonal elevation, static state layers, and interrupted spring
frames. The spring sampler is checked against all 12 independent pinned Kotlin
traces, including velocity and settling. Open `fixtures/foundation.html` through
a local server to interact with native color scopes, Expressive shape and spring
entry, exit, interruption, reversal and reduced motion. The browser checks
measure input response and frame pacing against the approved foundation
profile. Human QA remains required at the verified revision before each slice
can be accepted. The [gallery](gallery/index.html) includes live native Icon,
FocusRing, Ripple and Divider frames. `pnpm build:gallery` builds them without
Material Symbols fonts. For a
local licensed-font comparison, set `M3_ICON_FONT_CACHE` to the pinned cache
directory before building. That optional build copies fonts only into ignored
`dist/`; the public package remains font independent.

Pixel regression checks use the Chrome version recorded in
`fixtures/references/typography/manifest.json`. Set `M3_BROWSER_EXECUTABLE` to
that Chrome for Testing executable when the system Chrome version differs.
CI downloads that version and verifies the archive checksum before testing.
