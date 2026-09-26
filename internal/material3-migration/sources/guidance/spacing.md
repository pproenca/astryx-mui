# Rendered Material spacing guidance

- Sources: [overview](https://m3.material.io/styles/spacing/overview)
  and [tokens](https://m3.material.io/styles/spacing/tokens)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: spacing meanings and recommended units; the kit's component nodes
  govern geometry where they specify it.

The spacing system uses an 8dp base (`space100`) and recommends a subset of
multiples plus nested values such as 2, 4, 6, and 10dp. Spacing covers padding
inside an element, gaps between elements, and margins outside it. Component
anatomy typically uses parent padding and gaps before child margins. For
asymmetric layouts, leading and trailing are logical directions that reverse
in right-to-left content.

The overview says spacing responds to component size, layout, form factor,
and density. The tokens page places responsive and density logic at the
component attribute, with system units beneath it. That page explicitly
labels its spacing system tokens as currently used only in Jetpack Compose;
these names therefore are not evidence of a supported Material Web CSS API.

The migration must measure kit component geometry and use this guidance only
where the kit leaves a gap. A single global 8px grid does not prove exact
component padding, touch targets, or responsive density.
