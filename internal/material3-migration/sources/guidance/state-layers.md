# Rendered Material interaction-state guidance

- Sources: [state layers](https://m3.material.io/foundations/interaction/states/state-layers)
  and [applying states](https://m3.material.io/foundations/interaction/states/applying-states)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: common visual behavior. Exact component bindings and disabled
  treatment still require kit and pinned implementation inspection.

A state layer is a translucent overlay between a component's container and
content. The layer usually takes the content color, often the paired `on-*`
role, and uses a state-specific opacity. The page gives hover 8%, focus 10%,
press 10%, and drag 16%. It illustrates one visual state layer at a time,
although an element can simultaneously be selected and hovered or focused.
The token list also exposes a disabled value of 38%; the applying-states page
describes disabled appearance through color changes and reduced elevation,
so this entry must not be blindly rendered as a normal hover-like overlay.

The state-layer page illustrates a 40dp layer within a 48dp interactive target.
That example is not permission to shrink a component's interactive target to
40dp. The applying-states page says disabled components cannot be focused,
pressed, or dragged and do not gain hover layers. Hover is a cursor state;
focused elements reached by keyboard need a visible ring-like focus indicator
on the web. Pressed feedback can include a ripple and component-specific
elevation. Apply state styling to actionable children of a navigation or
container component rather than indiscriminately styling the entire parent.

The [kit inventory](../figma-kit-inventory.json) contains state variables and
styles but does not prove their component bindings. The native shared-state
task must match those bindings, keyboard semantics, and mixed states instead
of applying one global opacity rule to every element.
