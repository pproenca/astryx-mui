# Rendered Material icon guidance

- Sources: [icons overview](https://m3.material.io/styles/icons/overview)
  and [applying icons](https://m3.material.io/styles/icons/applying-icons)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: Material Symbols use, visual axes, interaction size, and labels. Exact
  glyphs and component bindings still require kit-node comparisons.

Material Symbols are the current default icon family in the guidance. They
have outlined, rounded, and sharp styles. Their four styling axes are weight,
fill, grade, and optical size. Fill can signal an unselected-to-selected
transition; weight and grade affect stroke appearance differently. Optical
size runs from 20 to 48dp and should be selected for the actual rendered size
instead of enlarging a single 24dp drawing. The page suggests grade 0 for a
dark symbol on a light background and -25 for a light symbol on a dark
background to account for visual bleed. These are guidance examples; exact
component defaults must come from the selected source binding.

For standard 24dp symbols, the guidance gives a 48dp target. In dense layouts
where mouse and keyboard are primary, it permits a 20dp symbol with a 40dp
target. Symbols below 20dp should be paired with text when the glyph is
complex or essential to an action. Navigation icons need clear labels, and
glyph meanings require locale review.

The local QA WOFF2 pins and licenses are in
[the font fixture record](../fonts/README.md). A `MaterialSymbol` comparison
must record the loaded family and file hash, glyph, style, axes, rendered
size, target size, theme, and selected/disabled state. The completed Core Icon
QA does not establish native Material Symbol parity.
