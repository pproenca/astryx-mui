# Native Material 3 package

`@astryxdesign/material3` is the native Material 3 package boundary. It is
private while its foundation gallery and components are being migrated. The
entry point now exposes the canonical Compose-first foundation graph, typed
CSS-backed Material roles, and source-only values. It does not yet claim a
completed Material 3 component.

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

`astryx.integration.mjs` locates `docs/`, where `material3-native.doc.mjs` is a
strongly typed, same-stem reference descriptor. A `components` root will be
declared when the first native component and its own same-stem `.doc.mjs` ship.
There is no central item catalog or per-item manifest map.

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
exports remain available. The same rule applies to MaterialSymbol and the
other current theme entry points until their native replacements pass review.

No released API is removed in this package slice. Removal requires an inventory
of affected consumer imports, published replacement paths, tested codemods,
compatibility and native regression evidence, deprecation notice, and an
explicitly approved major-release decision. The migration workbook owns task
order and acceptance; this section records the public compatibility boundary.

## Boundary fixture

Open `fixtures/native-token.html` to exercise scoped Material variable
overrides. Its deliberately distinct probe colors are structural test inputs,
not a Material visual baseline. `pnpm build` and `pnpm test` check the emitted
package, role-name inventory, Chrome computed styles, and exact light/dark
reference comparisons for color, typography, corners, Expressive shapes,
spacing/density, tonal elevation, static state layers, and interrupted spring
frames. The spring sampler is checked against all 12 independent pinned Kotlin
traces, including velocity and settling. Browser input response, frame pacing,
reduced-motion interaction, and the complete human QA receipt remain pending
for this foundation slice.
