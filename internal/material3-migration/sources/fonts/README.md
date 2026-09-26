# Font fixtures for source comparisons

The [Material typography guidance](https://m3.material.io/styles/typography/fonts)
uses Roboto by default for Material 3 components. It describes Roboto Flex as
an expressive variable typeface, but says it is not yet part of the M3 type
scale. The supplied kit's 30 active `M3/` text styles also name Roboto.
Emphasized styles change weight; they do not require switching font family.

The existing foundation QA fixture at
`packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf` is the Roboto
font to use for matched default and emphasized type scenarios. It came from
[Google Fonts at commit `23e54b51`](https://github.com/google/fonts/tree/23e54b51ddffbc7713c583748e3bd86f62b1fa4a/ofl/roboto),
has SHA256 `d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134`,
and already includes its SIL Open Font License notice. Do not create a second
Roboto fixture.

`RobotoFlex.ttf` comes from the same pinned Google Fonts commit under
`ofl/robotoflex/`. Its SHA256 is
`9b523f7d82593df0107173849ebb8c817471a1df4b4fb2c3cbf40cfd810c8281`.
The accompanying `OFL.txt` is its SIL Open Font License notice. Use this font
only for a scenario whose chosen source explicitly calls for Roboto Flex, and
record the axes and fallback chain. Its presence is not evidence that the
kit's 30 type styles use it.

The three Material Symbols WOFF2 families were downloaded for local QA from
[Google's pinned icon source](https://github.com/google/material-design-icons/tree/bd8cb85bd4bad964fe6918f79665bb40c3a8efef/variablefont)
at commit `bd8cb85bd4bad964fe6918f79665bb40c3a8efef`:

| Family   | SHA256                                                             |
| -------- | ------------------------------------------------------------------ |
| Outlined | `c5c96fcb27145d17a04cb2fa68d33921ca4258c6bb2cf6fac8b1bce401595e57` |
| Rounded  | `0865c62d7fda358cd4cdb77792b758afa66fae2c4159fa3fb04a2c1d05700e9e` |
| Sharp    | `2349783253d47d2d1b92ab63dd4284988f05e73459aa9c8f6e9a78ed360101c9` |

These icon font binaries stay in a local QA cache. The current Material 3
theme contract says Astryx does not redistribute a Material Symbols font
binary; consumers load their selected family. Their source repository is
licensed Apache-2.0. The pins above let a reviewer obtain and verify the
same files without publishing them in Astryx.
