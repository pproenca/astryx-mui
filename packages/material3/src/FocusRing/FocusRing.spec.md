---
schema_version: 3
template_version: 6
kind: component
id: component:FocusRing
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

# FocusRing component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public contract         | Additive `FocusRing` and `FocusRingProps` root exports from `@astryxdesign/material3`; a decorative direct child of its visual owner with required `placement: 'inset' \| 'outward'` and optional `controlRef` for a distinct semantic focus target.                                             |
| Behavior                | The visual parent paints the ring. Its own focus is used by default; `controlRef` identifies a separate focusable control, such as a visually hidden input. Browser visibility and modality apply to that semantic target, with pointerdown suppression.                                         |
| End-user impact         | Keyboard users of opted-in custom controls receive one source-backed indicator; existing native Material controls retain their Compose opacity indication.                                                                                                                                       |
| Builder impact          | A caller places one ring inside a positioned visual owner and chooses inset or outward presentation. When that owner is not the semantic focus target, the caller passes the target's ref. The target keeps its accessible role, name and focus behavior; outward placement needs visible space. |
| Compatibility/readiness | Additive, unreleased contract. The owner approved the API and Compose focus interpolation limits on 2026-09-27. Native implementation and acceptance are tracked at an exact revision in the sole migration workbook.                                                                            |
| Review checks           | Reject a public visibility/modality switch, a second semantic focus target, implicit Web outward default, duplicate indicator for one focus move, or a placement that cannot visibly meet its contract.                                                                                          |
| Governing rules         | `theme:material3` native direction; `architecture:public-component-api` INV1, INV3, INV4, INV5, INV8; `architecture:interaction-modality` INV1–INV6; `spec:AST-002/DEC-1` and DEC-2; `spec:AST-013` browser support; `spec:AST-020` accessibility evidence.                                      |

This table is a review projection. The body below states the owner-approved component-local contract. A changed PR head still needs exact-head approval under the repository review gate before merge.

## Intent

Custom focusable controls need an opt-in Material 3 visual focus primitive. A custom checkbox or radio may focus a visually hidden input while its visible indicator paints the ring; the semantic focus target and visual owner are then different elements. Native Material controls already own their default Compose focus opacity and must not use this public primitive merely to reproduce that default. The two ring geometries have distinct source authority: the inset pair is Compose; the outward ring is an explicit Material Web gap fill.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive export with no change to Core or existing Material controls.
- Controlled/uncontrolled behavior: visibility is derived; no public controlled state.
- Migration decision: none. Existing control focus and accessible semantics stay with their owners.

## Ownership boundary

**Owns**

- One decorative indicator for its direct visual parent.
- The selected ring geometry, color, and motion from the pinned source decision.
- Browser focus visibility and pointer suppression for the resolved semantic target.

**Does not own / non-goals**

- Focusability, keyboard activation, disabled state, accessible name, or hit target: the parent control owns them.
- The default 10% Compose focus opacity in native controls: each native control owns its default indication.
- A public `Ripple` export, generic DOM attachment service, arbitrary target search, or several competing attachment modes: the shared source decision does not authorize these APIs.
- Existing Core focus outline behavior or Core theme compatibility.

## Public concepts

| Concept         | Closed values or states                                | Meaning                                                                             | Availability by variant/orientation/state                      | Default                                   | Owner                 | Stability                    | Invalid-value behavior                                       |
| --------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- | --------------------- | ---------------------------- | ------------------------------------------------------------ |
| Placement       | `inset`, `outward`                                     | Caller selects the ring geometry that fits the visual owner's boundary.             | Every opted-in custom control with a direct-child visual slot. | Required; no implicit outward selection.  | `component:FocusRing` | Approved stable export.      | Type error; runtime rejects unsupported value.               |
| Visual owner    | Direct positioned parent                               | The ring paints on that parent's geometry without becoming a focus target.          | One ring per visual owner.                                     | Derived from DOM parent.                  | `component:FocusRing` | Approved stable association. | Invalid parent does not paint; development diagnostic.       |
| Semantic target | Parent or `controlRef: RefObject<HTMLElement \| null>` | The focusable target that controls visibility; a ref is used for a distinct target. | Focusable parent by default; proxy controls opt into the ref.  | Parent unless a `controlRef` is supplied. | `component:FocusRing` | Approved stable association. | Missing, detached or invalid explicit target does not paint. |

The component renders one decorative span and accepts no children. Its public `ref` targets that span rather than the semantic control. Its DOM passthrough cannot override `aria-hidden`, focusability, or pointer-event suppression. Consumer styling inputs compose with the internal visual styles without replacing the Material token values that define the selected placement.

`placement` is caller-owned: the component cannot infer whether a custom control wants an inset Compose ring or the separately evidenced outward Web ring. Visibility and modality are derivable from the browser and remain internal. By default, the semantic focus target is the direct visual parent. An optional `controlRef` is caller-owned information only when the control's focusable target is distinct from that visual parent. It does not change where the ring paints. The primitive never resolves an arbitrary ID or attaches imperatively to a target selected outside React. The owner approved this two-case association.

For `outward`, the visual owner and its ancestors must leave the active ring's outside extent unclipped. Chrome 153 clips a direct child's outward outline when its visual parent uses `overflow: hidden`; an outline on the parent itself escapes that clipping, but this API does not style or mutate the parent. Callers with a clipped control must choose an unclipped visual owner for the ring.

For a proxy control, the explicit ref keeps focus on the real input while the ring paints on its visible indicator:

```tsx
const inputRef = useRef<HTMLInputElement>(null);

<div className={styles.control}>
  <input ref={inputRef} type="checkbox" aria-label="Pin item" />
  <span className={styles.indicator}>
    <FocusRing placement="inset" controlRef={inputRef} />
  </span>
</div>;
```

The example illustrates association only. A real control still owns checked state, label, target size, and disabled behavior. A missing ref target cannot fall back to focusing or painting for an unrelated element.

## Behavioral and layout contract

| ID  | Invariant                                                                                                                                                                                                                                                                                                              | Basis                                                                 | Verification state                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| FR1 | FocusRing MUST render no independent focusable or accessible target.                                                                                                                                                                                                                                                   | Pinned Compose Ripple indication and Material Web decorative element. | Source-backed; native browser verification pending.                      |
| FR2 | `placement='inset'` MUST paint the two Compose strokes following the owner's shape: outer inset 0dp/width 2dp in Secondary, inner inset 1dp/width 3dp in OnSecondary, with fast spatial focus and fast effects blur interpolation.                                                                                     | Pinned `Ripple.kt` and focus reference.                               | Source-backed; native pixel/motion comparison pending.                   |
| FR3 | `placement='outward'` MUST paint the explicitly selected pinned Web ring with Secondary color, 3px held width, 8px active width, 2px offset and full corner, including its outward motion.                                                                                                                             | Pinned Material Web gap in `family-CM-0023`.                          | Source-backed gap; native browser comparison pending.                    |
| FR4 | The ring MUST show only for the resolved target's visible focus, clear on blur or pointerdown, and never paint a disabled target. Programmatic focus retains the current modality. An explicit ref is authoritative; while it is missing or detached, the ring MUST stay hidden rather than fall back to parent focus. | Browser semantics and `architecture:interaction-modality` INV1–INV6.  | Browser verification pending.                                            |
| FR5 | The owner MUST have exactly one visible indicator for a focus move; native controls keep their default 10% opacity indication unless their own approved contract selects another style.                                                                                                                                | Compose default and interaction-modality INV3.                        | Component family verification pending.                                   |
| FR6 | Reduced motion MUST retain an immediate visible final indicator without travel, and forced-colors MUST retain a discernible focus boundary.                                                                                                                                                                            | Browser accessibility translation of pinned references.               | Browser verification pending.                                            |
| FR7 | The ring MUST not change the visual parent's layout, hit testing, scroll position, or action handling. Outward placement requires an unclipped visual owner and ancestor chain so its full active extent can remain visible; clipped owners are invalid for this placement.                                            | Opt-in visual primitive and `spec:AST-002/DEC-2`.                     | Chrome child/parent clipping probe; native browser verification pending. |
| FR8 | Server render and first client render MUST agree on the decorative ring structure and hidden initial state; browser focus and modality enhancement begins after hydration without a false visible state.                                                                                                               | `spec:AST-013` FR9.                                                   | SSR and hydration verification pending.                                  |

### Allowed variation

- **AV1 — Theme.** Material light, dark and high-contrast roles alter resolved colors without changing placement geometry or focus ownership.
- **AV2 — Shape.** The parent's actual corner shape changes the Compose inset ring; the explicit Web outward ring retains its pinned full corner. Fixed source stroke widths and motion remain.

### Representative states

| State                                                    | Required invariant                                                           | Allowed variation                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| Keyboard focus                                           | One selected ring on the visual owner for the resolved semantic target.      | Theme and visual-owner shape.                    |
| Pointer focus or pointerdown on an already focused owner | Ring hidden.                                                                 | None.                                            |
| Blur, disablement or unmount                             | Ring cleared; listeners released.                                            | None.                                            |
| Focus, blur, rapid refocus                               | No stale animation can hide or restore the wrong focus state.                | Standard and Expressive spring curves for inset. |
| Reduced motion                                           | Immediate focused or unfocused ring.                                         | Theme and shape.                                 |
| Hidden input with visible indicator                      | `controlRef` follows input focus while the ring paints on its visual parent. | Theme and indicator shape.                       |
| Missing, detached or replaced `controlRef` target        | Ring clears without attaching to an unrelated owner.                         | None.                                            |
| RTL, scroll, forced colors                               | Ring remains aligned and perceivable without changing target semantics.      | Logical layout and system colors.                |
| Clipped visual owner with outward placement              | Caller supplies a different, unclipped visual owner for this placement.      | None; clipped placement is invalid.              |

### Transformation and precedence order

- **ORD1 — Source.** Choose placement explicitly; resolve its pinned geometry and Material role colors; derive browser visibility from the visual parent or explicit semantic target; apply the appropriate motion or reduced-motion final state.
- **ORD2 — Interaction.** A newer focus, blur or pointer event supersedes an older animation for the same owner. No old completion changes the visible state after supersession.

### Performance and resources

- **PR1 — No per-frame layout reads.** Motion may update visual values, but it must not measure the parent on every frame or install unbounded global listeners. Unmount releases any owner listener and animation frame.

## Accessibility contract

- **AR1 — Decorative only.** The ring is `aria-hidden`, never tabbable, never a pointer target, and never changes the parent's role or name.
- **AR2 — Visible focus.** A keyboard-visible focus state remains perceivable under reduced motion and forced colors; a ring cannot substitute for an inaccessible parent control.

## Design relationships

The inset ring follows the pinned Compose `Ripple.kt` focus configuration. The explicitly selected outward ring fills the documented Compose geometry gap with pinned Material Web values. No `current` design specification owns a further visual choice for this primitive. The source record and generated focus frames supply comparison evidence; they do not establish native acceptance.

## Family and system relationships

The native Material 3 theme record owns token and compatibility direction. The shared `family-CM-0023` source decision and pinned focus reference own source selection. This component owns only its public visual primitive and its browser association; each native control owns its own focus indication default.

## Verification map

| Contract           | Verification                                                                                    | Representative states                                                                     | Mutation or failure expectation                                            | Audit section               |
| ------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------- |
| FR1, FR4, FR5, AR1 | Native DOM and browser interaction checks                                                       | Keyboard, pointer, disabled, programmatic focus, hidden input proxy, missing/replaced ref | A second indicator, wrong target or focus target fails.                    | Focus owner and modalities. |
| FR2, FR3, FR6, AR2 | Matched light/dark/high-contrast pixels and watched motion frames against the pinned references | Inset, outward, interruption, reduced motion                                              | Wrong source geometry, colors or transition fails.                         | Visual and motion.          |
| FR7, PR1           | Rendered scroll, clipping, layout and listener checks                                           | Outward on unclipped and clipped owners, RTL, unmount                                     | A hidden ring on a valid owner, changed layout or orphaned listener fails. | Geometry and resources.     |
| FR8                | SSR output and real-browser hydration check                                                     | Unfocused then keyboard focus                                                             | A hydration mismatch or false initial ring fails.                          | Browser lifecycle.          |

## Decision log

### DEC-1 — Opt-in public visual primitive

**Reference:** `component:FocusRing/DEC-1`

**Decider:** `pproenca`, 2026-09-27

The project owner selected a standalone opt-in FocusRing for custom controls. Native controls retain the Compose opacity default.

### DEC-2 — Explicit placement and semantic target association

**Reference:** `component:FocusRing/DEC-2`

**Decider:** `pproenca`, 2026-09-27

The public API requires `placement` (`inset` or `outward`) and puts the decorative ring directly inside its visual owner. That parent supplies focus by default. Optional `controlRef` names a distinct semantic focus target, including a visually hidden input. Browser visibility and modality are internal; no public switch controls either. The owner approved this exact association and placement API.

### DEC-3 — Compose focus trajectory limits

**Reference:** `component:FocusRing/DEC-3`

**Decider:** `pproenca`, 2026-09-27

The native inset focus trajectory must remain within 0.0002 focus interpolation units of the pinned Compose position, 0.002 interpolation units per second of its velocity, and 0ms of its settling time. The approved [source baseline](../../../../internal/material3-migration/sources/baseline/focus-compose-first.json) carries independent standard and Expressive browser calculations. The limits govern native verification; the source calculation alone does not certify the component. The explicit Web-only outward placement retains its separate source motion, interruption and reduced-motion checks.

## Open questions

- **OQ2 — Which exact native pixel budgets make the two placements comparable to their pinned references?** (`human-design` after matched browser captures)

## Content boundary

This record owns the native FocusRing public contract. It does not copy consumer prop documentation, substitute source capture for native acceptance, or create a migration task list outside the sole workbook.
