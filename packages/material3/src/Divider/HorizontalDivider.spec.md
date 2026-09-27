---
schema_version: 3
template_version: 6
kind: component
id: component:HorizontalDivider
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

# HorizontalDivider component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contract         | Additive `HorizontalDivider` and `HorizontalDividerProps` native exports. Optional `thickness?: number \| 'hairline'`, `color?: string`, and `inset?: 'both' \| 'start' \| 'end'`.                    |
| Behavior                | A static horizontal line uses 1px and OutlineVariant by default. Numeric thickness is in CSS pixels; hairline occupies zero layout height and paints one device pixel. Inset adds a 16px logical gap. |
| End-user impact         | Native Material 3 screens receive the pinned Compose rule, with browser gap and accessibility behavior where selected.                                                                                |
| Builder impact          | Import native Material 3 CSS and choose explicit `role="separator"` only when the boundary is meaningful.                                                                                             |
| Compatibility/readiness | Additive native export; Core Divider remains available. The owner approved the API on 2026-09-27. Native acceptance is tracked in the sole migration workbook.                                        |
| Review checks           | Reject a Core wrapper, a semantic default, a physical-direction inset, a Web color replacing Compose's default, or a hairline that adds layout height.                                                |
| Governing rules         | `theme:material3`; `architecture:public-component-api`; pinned source decision `family-CM-0017`; `spec:AST-002`, `spec:AST-013`, `spec:AST-020`.                                                      |

This table projects the owner-approved public boundary. Native acceptance remains an exact-revision workbook gate.

## Intent

Provide the Compose horizontal rule as a native Material 3 component. The pinned Web inset fills a documented browser gap and is an explicit option.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native export; existing Core Divider is unchanged.
- Controlled/uncontrolled behavior: no state.
- Migration decision: DEC-1 selects the public native API.

## Ownership boundary

**Owns**

- Static rule paint, thickness, color, optional logical inset, and decorative default.

**Does not own / non-goals**

- Content labels, action, focus, or motion; the containing component owns them.
- Core Divider presentation and compatibility.

## Public concepts

| Concept   | Closed values or states   | Meaning                                            | Availability by variant/orientation/state | Default                  | Owner                         | Stability | Invalid-value behavior                    |
| --------- | ------------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------------ | ----------------------------- | --------- | ----------------------------------------- |
| Thickness | positive CSS px, hairline | Rule size or one physical pixel                    | Horizontal rule                           | Material token, then 1px | `component:HorizontalDivider` | Approved  | Reject nonpositive numeric values.        |
| Color     | CSS color                 | Overrides the Material divider color token         | All schemes                               | OutlineVariant           | `component:HorizontalDivider` | Approved  | Browser rejects invalid CSS color.        |
| Inset     | none, both, start, end    | 16px logical gap                                   | Horizontal rule                           | None                     | `component:HorizontalDivider` | Approved  | Type error for unsupported value.         |
| Semantics | decorative, separator     | Whether the boundary enters the accessibility tree | All states                                | Decorative               | `component:HorizontalDivider` | Approved  | Only explicit `role="separator"` opts in. |

## Behavioral and layout contract

| ID  | Invariant                                                                                                    | Basis                                                   | Verification state                        |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------- |
| FR1 | Default paint MUST be a 1px OutlineVariant horizontal line, overridden by supported Material divider tokens. | Pinned Compose `HorizontalDivider`.                     | Source backed; native checks in workbook. |
| FR2 | `hairline` MUST occupy zero layout height and paint one device pixel across supported densities.             | Pinned Compose `Dp.Hairline` adapted to browser pixels. | Browser density check.                    |
| FR3 | An inset MUST use a 16px logical gap on the selected side and remain bounded in narrow containers.           | Pinned Material Web gap fill.                           | RTL and narrow browser check.             |
| FR4 | The rule MUST remain static and pointer inert.                                                               | Compose standalone Divider and browser semantics.       | Browser check.                            |

### Allowed variation

- **AV1 — Theme.** Light, dark and Expressive roles may change the resolved color.
- **AV2 — Size and color.** Caller values override the default tokens.

### Representative states

| State                   | Required invariant                   | Allowed variation       |
| ----------------------- | ------------------------------------ | ----------------------- |
| Light, dark, Expressive | Token color and static geometry      | Resolved scheme color.  |
| RTL, narrow, inset      | Gap follows logical direction        | None.                   |
| Hairline, DPR 1 and 2   | One device pixel, zero layout height | Physical pixel density. |

### Transformation and precedence order

- **ORD1 — Paint.** Explicit thickness and color override tokens; tokens override the Compose defaults. Insets resolve in logical direction.

### Performance and resources

- **PR1 — Static paint.** A normal rule needs no animation, listeners, or repeated layout reads. Hairline density observation must clean up on unmount.

## Accessibility contract

- **AR1 — Decorative default.** The rule is hidden from assistive technology and is not focusable. Explicit `role="separator"` exposes its horizontal orientation without becoming an action target.
- **AR2 — Forced colors.** System contrast supplies a perceivable line.

## Design relationships

The pinned `family-CM-0017` source decision resolves Compose's default rule and Web's optional gap. The frozen Figma inventory has no standalone Divider set. Other components' internal rules remain their owners' scope.

## Family and system relationships

`theme:material3` owns the native token graph. `component:VerticalDivider` shares internal paint but owns its separate public orientation. Core `component:Divider` remains a compatibility surface.

## Verification map

| Contract          | Verification                                           | Representative states                              | Mutation or failure expectation                      | Audit section |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------- | ------------- |
| FR1–FR3           | Source projection pixel comparison and Chrome geometry | Light, dark, custom thickness, hairline, RTL inset | A pixel or occupied-size drift fails.                | Visual.       |
| FR4, AR1–AR2, PR1 | Browser semantics, forced colors and density checks    | Decorative, separator, DPR 1/2                     | A semantic, contrast, or physical-pixel drift fails. | Browser.      |

## Decision log

### DEC-1 — Native horizontal API

**Reference:** `component:HorizontalDivider/DEC-1`

**Decider:** `pproenca`, 2026-09-27

Publish the Compose-named native export with optional CSS-pixel or hairline thickness, CSS color and Web gap-fill inset. Keep the rule decorative by default and make separator semantics explicit. The owner approved this public API before native acceptance.

## Open questions

None for the public API. Native acceptance remains in the sole migration workbook.

## Content boundary

This record owns the horizontal public contract, not the migration backlog, source cache, or Core Divider API.
