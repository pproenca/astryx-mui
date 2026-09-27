---
schema_version: 3
template_version: 6
kind: component
id: component:Ripple
authority: current
archive_reason: null
superseded_by: null
approved_by: pproenca
approved_at: 2026-09-27
owners: [pproenca]
review_triggers: [public-api, behavior, layout, theming, accessibility]
verified_by: [scripts/check-knowledge.mjs]
modules: []
families: []
design_specs: []
architecture:
  [
    architecture:public-component-api,
    architecture:interaction-modality,
    architecture:component-theming-surface,
  ]
contributing: []
system_specs: [spec:AST-002, spec:AST-013, spec:AST-020]
---

# Ripple component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contract         | Additive `Ripple` and `RippleProps` exports from `@astryxdesign/material3`. The decorative span is a direct child of its positioned visual owner. `unbounded?: boolean` defaults to false; optional `controlRef` names a distinct semantic target; `dragged?: boolean` supplies a custom owner's semantic drag state. `ref` reaches the span. |
| Behavior                | The parent is the default interaction target. Pointer press, hover and focus are derived from that target; `controlRef` overrides it. The visual owner supplies the bounds, shape and inherited content color. A disabled target has no indication.                                                                                           |
| End-user impact         | Opted-in custom controls gain Compose-based press and state indications. Native Material controls use the same indication internally and keep their own semantics.                                                                                                                                                                            |
| Builder impact          | The caller places one Ripple inside a positioned visual owner, opts into unbounded paint only when needed, and supplies a semantic target ref only when distinct. Custom drag owners pass their drag state.                                                                                                                                   |
| Compatibility/readiness | Additive, unreleased contract. The owner approved the public boundary and exact React API on 2026-09-27. Native implementation and acceptance remain pending.                                                                                                                                                                                 |
| Review checks           | Reject a new action/focus target, implicit unbounded paint, exposed motion timing, duplicate public attachment modes, a stale release ending a newer press, or a Web timing substituted for Compose.                                                                                                                                          |
| Governing rules         | `theme:material3`; `family-CM-0023`; `architecture:public-component-api` INV1, INV3–INV8; `spec:AST-002` FR1–FR5, FR8–FR10, FR15–FR18; `spec:AST-013` browser support; `spec:AST-020` accessibility evidence.                                                                                                                                 |

This table projects the owner-approved public boundary. Native implementation and acceptance remain separate.

## Intent

Material controls need one Compose-first indication implementation. Builders of custom controls also need an opt-in decorative layer without adopting a Material control's action, focus or form semantics. The pinned Compose Ripple supplies paint and motion; pinned Material Web and browser standards supply DOM event and attachment behavior.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native package export; Core and the theme compatibility entry point keep their existing APIs.
- Controlled/uncontrolled behavior: hover, focus and press remain derived from the semantic target; only a custom owner's drag state is supplied.
- Migration decision: DEC-1 selects the public primitive and DEC-2 selects its exact association and configuration.

## Ownership boundary

**Owns**

- One visual indication on a positioned owner, with bounded paint by default.
- Compose press geometry, color opacity, state precedence and motion for standard and Expressive themes.
- Browser pointer, focus and cancellation translation for the associated semantic target.

**Does not own / non-goals**

- Action, focusability, accessible name, role, disabled policy, hit target or form behavior: the control owns them.
- FocusRing's explicit inset or outward ring presentation: `component:FocusRing` owns it.
- Public spring, duration, radius, color or visibility controls when the value is derivable from source, owner geometry and styling.
- A generic DOM attachment service, selector search, or imperative public attach/detach handle.

## Public concepts

| Concept         | Closed values or states       | Meaning                                                                                                      | Availability by variant/orientation/state                                     | Default                        | Owner              | Stability               | Invalid-value behavior                                                               |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------ | ------------------ | ----------------------- | ------------------------------------------------------------------------------------ |
| Paint bounds    | bounded, unbounded            | The caller decides whether indication clips to the owner's shape or expands around its center.               | Both Material modes and custom control shapes.                                | Bounded (`unbounded={false}`). | `component:Ripple` | Approved stable export. | Warn and suppress paint if the unbounded owner's ancestor clips the promised extent. |
| Semantic target | parent, explicit `controlRef` | The target emits input and focus while the direct parent paints.                                             | Positioned owner or visual proxy with hidden input.                           | Parent.                        | `component:Ripple` | Approved stable export. | A missing or detached explicit target stays unbound; never fall back silently.       |
| Drag state      | inactive, active              | A custom owner reports its semantic drag interaction when browser pointer movement alone cannot identify it. | Custom draggable controls; native controls may drive the same internal state. | Inactive.                      | `component:Ripple` | Approved stable export. | Disabled target suppresses even an active drag input.                                |

`unbounded` is caller-owned because two identical owner boxes can require clipped or outward indication. `controlRef` is caller-owned because a visually hidden input can be the semantic target while its sibling paints. `dragged` is caller-owned because movement alone cannot distinguish a drag interaction from scrolling or a held press. Color follows the owner's inherited `color` and Material token roles; default radius follows owner size. No dedicated color or radius prop is proposed.

`controlRef` uses `React.RefObject<HTMLElement | null>`; the public `ref` uses `React.Ref<HTMLSpanElement>` and reaches only the decorative element.

## Behavioral and layout contract

| ID  | Invariant                                                                                                                                                                                                                                                                                         | Basis                                                                          | Verification state                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| FR1 | Ripple MUST be decorative, pointer inert, absent from the accessibility tree and never an independent focus target.                                                                                                                                                                               | Pinned Compose indication and Material Web element.                            | Source-backed; native verification pending.  |
| FR2 | Bounded paint MUST start at the press point and clip to the owner's shape. Unbounded paint MUST start at the center and may extend outside it. Start radius is 30% of the largest dimension; default end radius is the half diagonal plus 10dp when bounded and the half diagonal when unbounded. | Pinned `CommonRipple.kt` and `RippleAnimationTest.kt`.                         | Source-backed; matched pixels pending.       |
| FR3 | Press MUST use Compose's 75ms linear alpha entry, 225ms FastOutSlowIn radius expansion, 225ms linear center move and 150ms linear exit. Early release waits for the full entry; a new press finishes the old ripple.                                                                              | Pinned `RippleAnimation.kt` and source baseline.                               | Source-backed; native timed capture pending. |
| FR4 | The latest active hover, focus or drag interaction MUST own one state layer. Hover opacity is 0.08, focus 0.10, drag 0.16 and pressed opacity 0.10. Hover transitions take 15ms, focus/drag entry 45ms, and drag exit 150ms.                                                                      | Pinned `Ripple.kt` and StateTokens.                                            | Source-backed; interaction tests pending.    |
| FR5 | A disabled or explicitly suppressed target MUST not paint. Missing or detached `controlRef` MUST not attach to the parent. The target's click, key handling, form and focus semantics remain unchanged.                                                                                           | Compose and Web attachment; browser standards.                                 | Browser verification pending.                |
| FR6 | Pointer cancellation, scrolling, blur, repeated presses, target replacement and unmount MUST clear or retarget indications without an earlier release ending a newer press.                                                                                                                       | Pinned interruption and browser translation.                                   | Browser verification pending.                |
| FR7 | Reduced motion MUST show an immediate perceivable press or state result without travel. Forced colors MUST preserve visible state indication.                                                                                                                                                     | Browser accessibility translation; Compose has no reduced-motion default here. | Browser verification pending.                |
| FR8 | Server and first client render MUST agree on hidden decorative structure. Ripple MUST not change owner layout, hit testing or scroll position.                                                                                                                                                    | Native runtime and browser semantics.                                          | SSR and browser verification pending.        |

### Allowed variation

- **AV1 — Theme.** Light, dark and Expressive token roles can change color; the pinned common Ripple timing and opacity remain.
- **AV2 — Shape and size.** The owner determines bounded clip shape and calculated default radius.

### Representative states

| State                                      | Required invariant                                              | Allowed variation             |
| ------------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| Pointer down, early release and held press | Compose geometry and fade sequence, with no stale completion.   | Owner size and shape.         |
| Hover, keyboard focus and drag             | One latest-interaction state layer.                             | Material color role.          |
| Touch scroll or pointer cancel             | No lingering press circle or canceled activation.               | Browser scroll gesture.       |
| Repeated press and disabled transition     | Older animation finishes; disabled paint clears.                | None.                         |
| Reduced motion, forced colors and RTL      | Perceivable indication without new semantics or geometry drift. | Platform color and direction. |

### Transformation and precedence order

- **ORD1 — Target.** Resolve the explicit semantic target or the visual parent; derive disabled, hover, focus and pointer interaction from it; combine the caller-owned drag state; choose the most recent active state layer.
- **ORD2 — Paint.** Resolve current Material content color, owner geometry and bounds; apply Compose timing and interruption or an immediate reduced-motion result.

### Performance and resources

- **PR1 — Bounded work.** Press animation may update visual values per frame, but MUST not read layout on every frame, install unbounded global listeners, or leave frames/listeners after target replacement or unmount.

## Accessibility contract

- **AR1 — Decorative only.** The span is `aria-hidden`, not tabbable and pointer inert. The semantic target retains its own role, accessible name and activation.
- **AR2 — Perceivable state.** Reduced motion and forced colors preserve visible press/focus feedback without replacing the control's focus indicator.

## Design relationships

The shared `family-CM-0023` source decision supplies Compose press/state geometry and motion. Material Web fills the browser attachment gap; its slower touch and growth timings are not native defaults. The frozen design kit has no standalone Ripple set. Native pixel and motion acceptance remain separate from this source decision.

## Family and system relationships

`theme:material3` owns token and compatibility direction. `component:FocusRing` owns its opt-in ring presentation. Native controls own their semantics and may use the same internal indication without rendering the public custom-control wrapper.

## Verification map

| Contract          | Verification                                                                             | Representative states                                            | Mutation or failure expectation                     | Audit section      |
| ----------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- | ------------------ |
| FR1, FR5, AR1     | DOM, keyboard and pointer browser tests                                                  | Parent, hidden input ref, disabled, unmount                      | Wrong target or extra focus/activation fails.       | Ownership.         |
| FR2–FR4           | Matched Compose/browser pixels, source trajectory samples and watched normal-speed clips | Bounded/unbounded, light/dark/Expressive, hover/focus/drag/press | Wrong geometry, opacity or timing fails.            | Visual and motion. |
| FR6–FR8, PR1, AR2 | Interruption, SSR/hydration, reduced-motion, forced-colors, RTL and performance checks   | Scroll cancel, rapid re-press, detached ref, first render        | Lingering ripple, mismatch or dropped frames fails. | Browser lifecycle. |

## Decision log

### DEC-1 — Opt-in public primitive

**Reference:** `component:Ripple/DEC-1`

**Decider:** `pproenca`, 2026-09-27

The project owner selected a public, opt-in visual Ripple for custom controls, alongside internal indication in native Material controls. Bounded paint is the default and unbounded is explicit.

### DEC-2 — React association and drag input

**Reference:** `component:Ripple/DEC-2`

**Decider:** `pproenca`, 2026-09-27

The public API uses a direct-child visual owner, `unbounded` for explicit outward paint, optional `controlRef` for a distinct semantic target and optional `dragged` for caller-owned drag state. Hover, focus, press, disabled, color, radius and motion remain derived. The owner approved these exact props.

## Open questions

- **OQ1 — What exact native pixel tolerance, if any, is acceptable after matched Compose-first captures?** (`human-design` after browser measurement)

## Content boundary

This record owns only the native Ripple public contract. It does not turn source capture into native acceptance or create a second migration task database.
