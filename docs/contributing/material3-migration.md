# Material 3 component migration

The [Material 3 theme](../../packages/themes/material3/README.md) supplies the
foundation. Component parity is earned one component at a time. This guide
applies the current [theme contract](../../packages/themes/material3/material3.spec.md)
and the relevant component, family, and design records; it does not replace
them.

## Pick a component

1. Start from a component inventory row and identify its Astryx owner and the
   matching Material element or pattern. Record an explicit gap when there is
   no one-to-one equivalent.
2. Link the [Material 3 guidance](https://m3.material.io/components) for design
   intent and the exact [pinned Material Web revision](https://github.com/material-components/material-web/tree/cbd34a8921915af94d5ef65c2a69eece41d5b4f3)
   used for web values and behavior. Distinguish CSS-backed tokens from Sass-only
   or generated values before using them.
3. Read the current Astryx component and family records. Preserve existing
   public APIs and portable Core token names unless their owners approve a
   separate compatibility change.

## Build the review slice

Implement one reviewable component slice with its variants and applicable
states. Verify anatomy, dimensions, touch targets, color roles in light and
dark modes, typography, shape, spacing, elevation, icons, and density. Check
enabled, hover, focus-visible, pressed, selected, disabled, invalid, loading,
read-only, and open states where applicable. Cover pointer, touch, keyboard,
form behavior, semantics, focus order, and contrast.

Include motion duration, easing, enter and exit, interruption, and reduced
motion. Check narrow and wide layouts, RTL, high contrast or forced colors, and
content that wraps or grows. Mark a dimension not applicable with a reason;
do not treat an untested dimension as a pass.

## Verify and review

Run focused tests and expose the finished slice in an interactive preview with
controls for the applicable variants and states. Record the source links,
tests, preview URL, and exact code revision in the component's migration
receipt. A human then interacts with that revision and records approval or
changes requested. Any change after approval requires another review of the
affected states.

Close the component task only when its source mapping, applicable acceptance
checks, automated evidence, and interactive review are complete. The
[theme specification](../../packages/themes/material3/material3.spec.md#verification-map)
defines the foundation and component evidence boundary. A finished foundation
does not certify unreviewed components.
