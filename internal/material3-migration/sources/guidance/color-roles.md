# Rendered Material color-role guidance

- Source: [Material Design 3 color roles](https://m3.material.io/styles/color/roles)
- Observed: 2026-09-26, rendered page in a browser
- Scope: foundation role pairing and use; this page does not supply the kit's
  resolved palette values.

The page presents 26 standard roles across primary, secondary, tertiary, error,
surface, and outline groups. It treats color roles as the connection between
component anatomy and scheme values. Custom components need the same role
mapping. The page warns that arbitrary role combinations can lose contrast,
especially under dynamic color and user-controlled contrast.

## Source rules relevant to the native graph

- Use an `on-*` role for text or icons on its paired fill or container role.
  A container role is a fill, not a text or icon color.
- Use surface roles for backgrounds. `on-surface` and `on-surface-variant`
  provide different text and icon emphasis across surface containers.
- The five surface-container levels express hierarchy. Keep a layout region's
  role mapping consistent across breakpoints even when the layout changes.
- `outline` marks important target boundaries such as a text-field outline.
  `outline-variant` serves decorative boundaries such as dividers; using it
  alone to define an interactive target can lose needed contrast.
- Fixed accent roles hold the same tone in light and dark schemes. Their `on`
  partners must be used for content. Ordinary accent roles are preferred where
  theme-dependent contrast is needed.
- Error roles stay static across dynamic color schemes, while still adapting
  between light and dark themes.

These are usage rules observed in the rendered guidance. Exact role values and
the four kit/Web light-scheme differences are recorded in
[foundation reconciliation](../reconciliation.md); the supplied Figma kit
governs those values. A rendered page observation does not prove native color
contrast or pixels.
