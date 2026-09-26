# Rendered Material elevation guidance

- Sources: [overview](https://m3.material.io/styles/elevation/overview)
  and [tokens](https://m3.material.io/styles/elevation/tokens)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: elevation hierarchy and state transitions. The Figma kit and pinned
  Web source provide concrete shadow implementations for comparison.

Elevation expresses relative z-axis distance between surfaces. The overview
applies it to all surfaces and components, advises keeping the number of levels
small, and treats tonal surface changes and shadows as alternative cues. Its
level token carries neither a shadow nor a color by itself; each platform
chooses how to render the level. The page recommends keeping Material
components' default resting elevation. It describes a consistent one-level
increase on hover for buttons and other applicable components.

The tokens page specifies levels 0–5 with dp heights of 0, 1, 3, 6, 8, and 12
respectively. It says surface tint color is deprecated. Resting examples
include elevated buttons/cards/chips at level 1, menus and scrolled app bars
at level 2, and modal dialogs and FABs at level 3. Levels 4 and 5 are not
assigned as resting levels in its table. Filled, tonal, and outlined buttons
rest at level 0. The page says hover or focus usually raises applicable
component elevation by one level.

The [kit's light/dark elevation export](../figma-exports/elevation.png) and
[source reconciliation](../reconciliation.md) hold concrete shadow geometry.
Matching numeric level or shadow values does not establish rendered parity:
the native gallery must compare pixels on matched surfaces and exercise its
state changes.
