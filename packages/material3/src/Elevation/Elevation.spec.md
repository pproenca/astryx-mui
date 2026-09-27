---
schema_version: 3
template_version: 6
kind: component
id: component:Elevation
authority: current
archive_reason: null
superseded_by: null
approved_by: pproenca
approved_at: 2026-09-27
owners: [pproenca]
review_triggers: [public-api, behavior, layout, theming, accessibility]
verified_by: [packages/material3/scripts/check-elevation-pixels.mjs]
modules: []
families: []
design_specs: []
architecture:
  [architecture:public-component-api, architecture:component-theming-surface]
contributing: []
system_specs: [spec:AST-002, spec:AST-013, spec:AST-020]
---

# Elevation component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contract         | Additive `Elevation` and `ElevationProps` exports from `@astryxdesign/material3`, with optional level 0 through 5 defaulting to 0.                                                                         |
| Behavior                | A decorative direct child of a positioned visual owner paints separate key and ambient shadow layers using the native Material shadow color role.                                                          |
| End-user impact         | Custom Material surfaces can display one of six pinned shadow levels without changing their accessibility or action semantics.                                                                             |
| Builder impact          | The visual owner supplies shape, surface color, state transitions, focus and actions. `Elevation` is one inert child.                                                                                      |
| Compatibility/readiness | Additive native export; Core and compatibility theme exports remain available. The owner approved the API on 2026-09-27. Native acceptance is tracked at an exact revision in the sole migration workbook. |
| Review checks           | Reject a Core wrapper, combined shadow approximation, tonal color, implicit animation, focus target, z-index, or pointer handling.                                                                         |
| Governing rules         | `theme:material3`, `architecture:public-component-api`, family decision `family-CM-0018`, and `spec:AST-002`, `spec:AST-013`, `spec:AST-020`.                                                              |

This table projects the owner-approved public boundary. Native acceptance remains an exact-revision workbook gate.

## Intent

Provide an opt-in browser shadow layer for custom visual owners. Pinned Compose Surface owns tonal and shadow elevation independently, and the frozen Figma styles fill the browser shadow geometry gap. Material Web supplies the decorative attachment model.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native export; existing Core and theme behavior is unchanged.
- Controlled/uncontrolled behavior: none.
- Migration decision: DEC-1 selects the owner-approved opt-in API.

## Ownership boundary

**Owns**

- Six static shadow levels, including shadow-free level 0.
- Separate key and ambient layers, inheriting the direct visual owner's shape.
- Scoped Material shadow color token consumption.

**Does not own / non-goals**

- Tonal color, nested absolute tonal elevation, z-index, state transitions, motion, focus, pointer behavior, or semantics.
- Compatibility theme aliases or Core adaptation.

## Public concepts

| Concept      | Closed values or states  | Meaning                                                    | Availability by variant/orientation/state | Default            | Owner                 | Stability              | Invalid-value behavior                               |
| ------------ | ------------------------ | ---------------------------------------------------------- | ----------------------------------------- | ------------------ | --------------------- | ---------------------- | ---------------------------------------------------- |
| Level        | 0, 1, 2, 3, 4, 5         | Pinned Compose shadow level, mapped to 0, 1, 3, 6, 8, 12dp | Light, dark, Expressive, custom tokens    | 0                  | `component:Elevation` | Owner approved         | Type error and runtime range rejection.              |
| Visual owner | Direct positioned parent | Supplies geometry and shape for the shadow                 | Any custom visual surface                 | Caller supplied    | Caller                | Owner approved         | Static parent cannot provide the placement contract. |
| Shadow color | `--md-sys-color-shadow`  | Scoped system color consumed by both layers                | Every theme                               | Native token graph | `theme:material3`     | Current token contract | Browser CSS resolution.                              |

## Behavioral and layout contract

| ID  | Invariant                                                                                                            | Basis                                                                              | Verification state                 |
| --- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| EL1 | Each level MUST use the canonical key and ambient geometry and independent 0.3 and 0.15 layer opacities.             | Pinned Compose levels, frozen Figma effects, pinned Material Web browser geometry. | Source backed; native pixel check. |
| EL2 | The decorative layer MUST inherit the owner's border radius, occupy no flow space, and not intercept pointer events. | Approved visual ownership and browser semantics.                                   | Browser and unit check.            |
| EL3 | Tonal color, z-index, and transition MUST remain owner controlled; changing level itself adds no animation.          | Pinned Compose Surface ownership and source motion finding.                        | Browser check.                     |
| EL4 | A scoped Material shadow color override MUST affect both layers without legacy Core tokens.                          | Native Material token contract.                                                    | Browser check.                     |

### Allowed variation

- **AV1 — Theme.** Native light, dark, Expressive, and caller-scoped Material tokens may alter the shadow color.
- **AV2 — Shape.** The direct visual parent's shape alters shadow corners without changing source geometry.

### Representative states

| State                   | Required invariant                                   | Allowed variation                |
| ----------------------- | ---------------------------------------------------- | -------------------------------- |
| Level 0–5               | Exact key and ambient geometry                       | Theme color and inherited shape. |
| Light, dark, Expressive | Same six levels and opacity split                    | Resolved Material shadow color.  |
| RTL, zoom, narrow owner | Shadow stays on the owner                            | Owner layout.                    |
| Forced colors           | Inert decorative layer with no new semantic boundary | System may suppress shadows.     |

### Transformation and precedence order

- **ORD1 — Source.** Compose chooses levels and tonal/shadow independence; Figma fills CSS shadow pixels; Web supplies browser attachment.
- **ORD2 — Token.** A scoped `--md-sys-color-shadow` value resolves on the visual owner and colors both layers.

### Performance and resources

- **PR1 — Static paint.** Elevation adds no event listener, animation, layout read, or timer.

## Accessibility contract

- **AR1 — Decoration.** The component is aria-hidden and never exposes a role or tab stop.
- **AR2 — Input.** Pointer, keyboard, and focus behavior remain with the visual owner.

## Design relationships

- Native Surface and each native control own their tonal color and elevation state motion.
- Core theme shadow aliases remain a compatibility surface and do not govern native paint.

## Family and system relationships

The pinned `family-CM-0018` source decision owns the six levels and browser shadow gap. `theme:material3` owns the native shadow color role. Future native Surface and controls select their own levels and transitions.

## Verification map

| Contract              | Verification                                                   | Representative states                             | Mutation or failure expectation              | Audit section |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- | ------------- |
| EL1, EL4              | Matched Chrome pixel comparison and token override             | Six levels, light, dark, Expressive               | A geometry or scoped color drift fails.      | Visual.       |
| EL2–EL3, AR1–AR2, PR1 | Browser semantics, pointer, RTL, zoom and forced-colors checks | Static owner, custom radius, keyboard and pointer | A semantic, geometry, or motion drift fails. | Browser.      |

## Decision log

### DEC-1 — Public ownership and level API

**Reference:** `component:Elevation/DEC-1`

**Decider:** `pproenca`, 2026-09-27

Publish an opt-in decorative `Elevation` for custom positioned owners. Its optional level defaults to 0, and it has no tonal, semantic, focus, pointer, z-index, or animation behavior.

**Owner approval.** pproenca approved the ownership boundary and exact public API on 2026-09-27. Human QA of the native implementation is a separate workbook gate.

**Source evidence.** `internal/material3-migration/sources/families/family-CM-0018.md` and `internal/material3-migration/sources/baseline/elevation-compose-first.json`.

## Open questions

None for the public API. Native pixel and interactive acceptance remain in the sole migration workbook.

## Content boundary

This record owns the Elevation public contract. Source research and migration status remain in the family decision and sole workbook.
