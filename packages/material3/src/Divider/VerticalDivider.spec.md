---
schema_version: 3
template_version: 6
kind: component
id: component:VerticalDivider
authority: current
archive_reason: null
superseded_by: null
approved_by: pproenca
approved_at: 2026-09-27
owners: [pproenca]
review_triggers: [public-api, behavior, layout, theming, accessibility]
verified_by: [packages/material3/scripts/check-divider-pixels.mjs]
modules: []
families: []
design_specs: []
architecture:
  [architecture:public-component-api, architecture:component-theming-surface]
contributing: []
system_specs: [spec:AST-002, spec:AST-013, spec:AST-020]
---

# VerticalDivider component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public contract         | Additive `VerticalDivider` and `VerticalDividerProps` native exports with optional `thickness?: number \| 'hairline'` and `color?: string`.                                                                  |
| Behavior                | A static vertical line uses 1px and OutlineVariant by default. Numeric thickness is in CSS pixels; hairline occupies zero layout width and paints one device pixel. Height comes from its containing layout. |
| End-user impact         | Native Material 3 layouts receive the pinned Compose vertical rule.                                                                                                                                          |
| Builder impact          | Give the containing layout a definite height, import native Material 3 CSS, and use `role="separator"` only for a meaningful boundary.                                                                       |
| Compatibility/readiness | Additive native export; Core Divider remains available. The owner approved the API on 2026-09-27. Native acceptance is tracked in the sole migration workbook.                                               |
| Review checks           | Reject a Core wrapper, horizontal-only inset on this API, a semantic default, or a hairline that adds layout width.                                                                                          |
| Governing rules         | `theme:material3`; `architecture:public-component-api`; pinned source decision `family-CM-0017`; `spec:AST-002`, `spec:AST-013`, `spec:AST-020`.                                                             |

This table projects the owner-approved public boundary. Native acceptance remains an exact-revision workbook gate.

## Intent

Provide the Compose vertical rule as a native Material 3 component for layouts with a definite cross-axis height.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native export; existing Core Divider is unchanged.
- Controlled/uncontrolled behavior: no state.
- Migration decision: DEC-1 selects the public native API.

## Ownership boundary

**Owns**

- Static vertical rule paint, thickness, color, and decorative default.

**Does not own / non-goals**

- Container height, labels, action, focus, or motion; the containing component owns them.
- Core Divider presentation and compatibility.

## Public concepts

| Concept   | Closed values or states   | Meaning                                            | Availability by variant/orientation/state | Default                  | Owner                       | Stability | Invalid-value behavior                    |
| --------- | ------------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------------ | --------------------------- | --------- | ----------------------------------------- |
| Thickness | positive CSS px, hairline | Rule size or one physical pixel                    | Vertical rule                             | Material token, then 1px | `component:VerticalDivider` | Approved  | Reject nonpositive numeric values.        |
| Color     | CSS color                 | Overrides the Material divider color token         | All schemes                               | OutlineVariant           | `component:VerticalDivider` | Approved  | Browser rejects invalid CSS color.        |
| Semantics | decorative, separator     | Whether the boundary enters the accessibility tree | All states                                | Decorative               | `component:VerticalDivider` | Approved  | Only explicit `role="separator"` opts in. |

## Behavioral and layout contract

| ID  | Invariant                                                                                                  | Basis                                                   | Verification state                        |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| FR1 | Default paint MUST be a 1px OutlineVariant vertical line, overridden by supported Material divider tokens. | Pinned Compose `VerticalDivider`.                       | Source backed; native checks in workbook. |
| FR2 | `hairline` MUST occupy zero layout width and paint one device pixel across supported densities.            | Pinned Compose `Dp.Hairline` adapted to browser pixels. | Browser density check.                    |
| FR3 | The rule MUST remain static and pointer inert; height follows its containing layout.                       | Compose standalone Divider and browser semantics.       | Browser check.                            |

### Allowed variation

- **AV1 — Theme.** Light, dark and Expressive roles may change the resolved color.
- **AV2 — Size and color.** Caller values override the default tokens.

### Representative states

| State                      | Required invariant                  | Allowed variation                   |
| -------------------------- | ----------------------------------- | ----------------------------------- |
| Light, dark, Expressive    | Token color and static geometry     | Resolved scheme color.              |
| Custom thickness and color | Override tokens                     | Positive width and valid CSS color. |
| Hairline, DPR 1 and 2      | One device pixel, zero layout width | Physical pixel density.             |

### Transformation and precedence order

- **ORD1 — Paint.** Explicit thickness and color override tokens; tokens override the Compose defaults. The containing layout supplies height.

### Performance and resources

- **PR1 — Static paint.** A normal rule needs no animation, listeners, or repeated layout reads. Hairline density observation must clean up on unmount.

## Accessibility contract

- **AR1 — Decorative default.** The rule is hidden from assistive technology and is not focusable. Explicit `role="separator"` exposes its vertical orientation without becoming an action target.
- **AR2 — Forced colors.** System contrast supplies a perceivable line.

## Design relationships

The pinned `family-CM-0017` source decision resolves Compose's vertical default. The frozen Figma inventory has no standalone Divider set.

## Family and system relationships

`theme:material3` owns the native token graph. `component:HorizontalDivider` shares internal paint but owns the separately evidenced inset. Core `component:Divider` remains a compatibility surface.

## Verification map

| Contract          | Verification                                                | Representative states          | Mutation or failure expectation                      | Audit section |
| ----------------- | ----------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- | ------------- |
| FR1–FR2           | Source projection pixel comparison and Chrome density check | Light, custom width, hairline  | A pixel or occupied-size drift fails.                | Visual.       |
| FR3, AR1–AR2, PR1 | Browser semantics and forced colors                         | Decorative, separator, DPR 1/2 | A semantic, contrast, or physical-pixel drift fails. | Browser.      |

## Decision log

### DEC-1 — Native vertical API

**Reference:** `component:VerticalDivider/DEC-1`

**Decider:** `pproenca`, 2026-09-27

Publish the Compose-named native export with optional CSS-pixel or hairline thickness and CSS color. Keep the rule decorative by default and make separator semantics explicit. Horizontal inset remains on `HorizontalDivider` only. The owner approved this public API before native acceptance.

## Open questions

None for the public API. Native acceptance remains in the sole migration workbook.

## Content boundary

This record owns the vertical public contract, not the migration backlog, source cache, or Core Divider API.
