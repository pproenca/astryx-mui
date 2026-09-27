# Icon family source resolution

This record resolves the standalone `md-icon` candidate (`CM-0024`) for the
pinned native migration. It does not merge IconButton, tabs, or their actions
into the Icon family.

## Coverage lookup

- **Compose present.** At AndroidX commit
  `a095da93f8e98dea8748ceed79ea8427aade245f`, `Icon.kt` implements vector,
  bitmap, and painter overloads. The pinned file hash and a rendered source
  fixture are in [the existing icon decision](../compose-icons.md) and
  [reference manifest](../icon-reference/manifest.json).
  Pinned `IconTest.kt` contains standalone tests. Its vector size, scaling,
  tint, and named-image cases translate to native SVG assertions. Android
  bitmap/painter intrinsic-size and bitmap screenshot cases do not describe
  this web SVG or font channel; browser `<img>` remains available to consumers
  for bitmap artwork. The selected six test cases and source lines are recorded
  in the Icon baseline. IconButton tests stay with the interactive control
  family.
- **Figma standalone set absent.** The frozen
  [171-set inventory](../figma-kit-inventory.json), SHA-256
  `64fdc45c9f6dd6d4921aa33cbc2f431c16ee4ac6d2fabf27a24ac08035f9e468`,
  has 21 names containing “Icon”. They are Icon button variants or tab
  arrangements. None is a standalone Icon component set. This lookup does not
  rule out icon artwork inside another component, which remains that
  component's design scope.
- **Material Web present.** At commit
  `cbd34a8921915af94d5ef65c2a69eece41d5b4f3`,
  [`icon/icon.ts`](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/icon/icon.ts)
  registers `md-icon`. Its
  [internal element](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/icon/internal/icon.ts)
  renders a slot and hides decoration from accessibility by default, allowing
  an explicit `aria-hidden="false"`. Its
  [style source](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/icon/internal/_icon.scss)
  uses the two supported public tokens `--md-icon-font` and `--md-icon-size`,
  whose pinned defaults are Material Symbols Outlined and 24px. The
  [pinned component guide](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/icon.md)
  covers ligatures, codepoints, SVG children, font family and accessible names.
  These are browser implementation facts, not permission to replace Compose
  design or behavior defaults.

## Selected concerns

**Design and defaults: Compose.** `Icon.kt` defaults monochrome tint to
`LocalContentColor`, permits no tint for multicolored artwork, and uses 24dp
only when the painter lacks an intrinsic size. It does not select artwork or
force every icon to 24dp. A containing Button or other component can specify
its own icon dimensions. The pinned [Compose decision](../compose-icons.md)
owns those facts.

**Behavior: Compose.** A meaningful description produces image semantics;
null is decorative. Icon is presentational and has no activation behavior.
The interactive parent owns the action, accessible name and target size.

**Motion: static at this family boundary.** The pinned `Icon.kt` draws its
current painter and tint without an animation spec or transition. No default
Icon enter, exit, interruption or reversal is defined. A containing control
can animate selection or a Material Symbols FILL axis, and that control must
resolve and watch its own motion source. This is a source-backed motion N/A
for the standalone Icon, not a blanket exemption for icon-bearing components.

**Browser semantics: pinned Web plus native standards.** Render an SVG or
font glyph with an appropriate image name when meaningful and hide decorative
glyphs. Keep action and keyboard semantics on a button or equivalent owner.
Use supported Material CSS role names directly; do not require Core theme
aliases. The native package may offer SVG and font channels, but a font file
must be loaded explicitly when a font channel is selected.

**Artwork/font gap.** Compose accepts supplied artwork and chooses no Material
Symbols family or variable axes. The captured
[Material icon guidance](../guidance/icons.md) supplies the optional Outlined,
Rounded and Sharp presentation families and FILL, weight, grade and optical
size axes. Its dark grade and dense-size examples are not Compose defaults.
The selected glyph, font or SVG hash, axes, size, tint and theme must be
recorded per native comparison. Existing
[source captures](../icon-reference/README.md) provide a pinned starting
point; they do not prove native parity.

Google LLC Material Web and The Android Open Source Project Compose sources
are Apache-2.0. The frozen Material Design Kit is CC BY 4.0. Attribution and
licenses remain in the native package when implementation assets are selected.
