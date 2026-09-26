# Rendered Material typography-font guidance

- Source: [Material Design 3 typography fonts](https://m3.material.io/styles/typography/fonts)
- Observed: 2026-09-26, rendered page in a browser
- Scope: typeface selection and fallback; the kit's active type styles supply
  the migration's numeric metrics.

The page identifies Roboto as the default Material 3 typeface and says static
fonts such as Roboto are currently applied by default to components. It presents
Roboto Flex as a variable typeface with expressive axes, but says it is not yet
part of the Material 3 type scale. The page describes Noto Sans as a fallback
for scripts unsupported by the current font.

For a product that elects to use Roboto Flex, the page gives the fallback order
Roboto Flex, Roboto, then Noto Sans. Its Roboto Flex axis table lists slant,
width, weight, grade, and optical size, with additional detailed axes. This
does not authorize switching the supplied kit's 30 active Roboto styles to
Roboto Flex or Google Sans Flex.

The pinned and licensed local fonts, file hashes, and optional Expressive QA
asset are in [the font fixture record](../fonts/README.md). Each visual
comparison must record the actual loaded family, file hash, fallback behavior,
and variable-axis settings.
