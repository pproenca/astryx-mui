# Rendered Material shape guidance

- Sources: [overview and principles](https://m3.material.io/styles/shape/overview-principles)
  and [corner radius scale](https://m3.material.io/styles/shape/corner-radius-scale)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: shape-system membership, corner semantics, and usage. The supplied
  kit provides the exact design variables and 35-shape export.

The overview describes a corner scale, a library of original shapes, and shape
morphing. Its Expressive update identifies 35 added shapes and three increased
corner roles: large increased 20dp, extra large increased 32dp, and extra extra
large 48dp. It also says `full` replaced the earlier practice of defining a
fully rounded corner as 50% of the component size. The page pairs shape with
typography and illustrates Google Sans Flex as sharing roundness attributes;
that illustration does not change the kit's active Roboto type styles.

The corner-scale page names ten steps: none 0, extra small 4, small 8, medium
12, large 16, large increased 20, extra large 28, extra large increased 32,
extra extra large 48, and full. It describes `full` by its fully rounded
appearance, not a universal pixel number. It distinguishes symmetric shapes
from asymmetric shapes with separate inner-corner values, especially for
closely grouped items. A style-level corner change affects every component
mapped to that style; a component-level remapping affects only that component.

The page advises using expressive shapes selectively and protecting content in
text-heavy containers. For nested rounded shapes it describes optical
roundness by reducing the outer radius by the padding to obtain the inner
radius. Morphing is presented as feedback for selection, work in progress, and
environmental changes, including tap, swipe, scroll, release, and long press.
Those behaviors still need source clips and interaction-specific native tests.

The [kit's corner and shape exports](../README.md#rendered-kit-references)
remain the visual references. Its `Corner/Full` variable is 1000px while the
rendered scale labels the full example `50%`; neither number should be silently
substituted for the source's semantic `full` role across every component.
