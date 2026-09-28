---
schema_version: 3
template_version: 6
kind: component
id: component:OutlinedField
authority: current
archive_reason: null
superseded_by: null
approved_by: pproenca
approved_at: 2026-09-28
owners: [pproenca]
review_triggers: [public-api, behavior, layout, theming, accessibility, motion]
verified_by:
  [
    internal/material3-migration/sources/field-reference/capture-field-springs.mjs,
  ]
modules: []
families: []
design_specs: []
architecture: [architecture:public-component-api]
contributing: []
system_specs: [spec:AST-002, spec:AST-020]
---

# OutlinedField component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public contract         | Additive `OutlinedField` and `OutlinedFieldProps` exports from `@astryxdesign/material3`. The shared field-shell props and state meanings follow the current `FilledField` contract. |
| Behavior                | Paint Compose's outlined decoration and cutout floating label around one caller-owned semantic control. Explicit `focused` overrides nested focus observation.                       |
| End-user impact         | A custom input can display the Material 3 outlined field without taking on a second form control.                                                                                    |
| Builder impact          | The caller owns input semantics, value, validation, label association, and populated state. Standard native outlined text fields will include their own decoration.                  |
| Compatibility/readiness | Additive native API approved on 2026-09-28; native implementation and workbook QA remain pending.                                                                                    |
| Review checks           | Reject a Core wrapper, filled underline in place of the perimeter outline, a second semantic input, and a Web value overriding a specified Compose value.                            |
| Governing rules         | `theme:material3`, pinned `family-CM-0021`, `architecture:public-component-api`, `spec:AST-002`, `spec:AST-020`.                                                                     |

## Intent

Offer Compose's outlined TextField decoration as an advanced visual shell. The shared source decision and the current FilledField record define the common state and slot vocabulary; this record owns the outlined geometry and public export.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native export; Core Field and TextInput remain available.
- Controlled/uncontrolled behavior: common visual state meanings follow the current FilledField contract.
- Migration decision: DEC-1 is the owner-approved public API.

## Ownership boundary

**Owns**

- Outlined perimeter, focus/error stroke, cutout floating label, supporting-text layout, Compose state colors and motion, and direct Material token consumption.

**Does not own / non-goals**

- The caller's input behavior, form value, validity, focus placement, accessibility semantics, or any ordinary native TextField layer assembly.

## Public concepts

| Concept              | Closed values or states                                | Meaning                                               | Availability | Default                      | Owner                     | Stability      | Invalid-value behavior            |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------ | ---------------------------- | ------------------------- | -------------- | --------------------------------- |
| Content and slots    | Shared `FilledField` content and optional visual slots | One caller-owned control and Compose decoration lanes | All          | Child required, slots absent | `component:OutlinedField` | Owner approved | TypeScript rejects missing child. |
| Focus                | Explicit boolean or nested focus observation           | Select visual focused phase                           | All          | Observe focus within         | `component:OutlinedField` | Owner approved | TypeScript rejects other values.  |
| Population and flags | `populated`, `disabled`, `error` booleans              | Select source visual phases                           | All          | `false`                      | Caller                    | Owner approved | TypeScript rejects other values.  |

## Behavioral and layout contract

| ID  | Candidate invariant                                                                                                                                              | Basis                                              | Draft review state             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| OF1 | The shell MUST use pinned 56 dp minimum height and 280 dp minimum width subject to parent constraints, an outlined perimeter, and a 1 dp to 2 dp focused stroke. | `family-CM-0021` Compose source route.             | Source backed; verify native.  |
| OF2 | The floating label MUST form a source-shaped outline cutout without obscuring the border or control text.                                                        | Pinned OutlinedTextField and tests.                | Source backed; verify native.  |
| OF3 | Label, placeholder, outline thickness and color MUST follow the selected Compose phase and spring paths, including interruption and reversal.                    | Pinned TextField implementation and watched clips. | Source backed; verify native.  |
| OF4 | Visual state MUST NOT mutate the child's native input semantics, and scoped overrides MUST resolve through Material roles.                                       | Approved ownership boundary and `theme:material3`. | Owner approved; verify native. |

### Allowed variation

- **AV1 — Theme.** Material roles and Expressive springs vary by theme.
- **AV2 — Content.** Optional lanes collapse when absent.

### Representative states

| State                                      | Required invariant                             | Allowed variation               |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------- |
| Empty, populated, focused, error, disabled | Outlined cutout and stroke follow source phase | Caller content and semantics.   |
| Standard, Expressive, RTL, zoom            | Source dimensions and logical lanes            | Parent width and spring scheme. |

### Transformation and precedence order

- **ORD1 — State.** Explicit `focused` overrides nested focus observation; populated and disabled/error flags select source phase without taking input ownership.
- **ORD2 — Paint.** Compose outline geometry and tokens govern; Figma fills only recorded coverage; Web supplies browser shell semantics.

### Performance and resources

- **PR1 — Motion.** Reuse the native field motion recipe and detach focus observation on unmount.

## Accessibility contract

- **AR1 — One input.** The shell adds no role, tab stop, value, or validation announcement; the caller's child owns these semantics.
- **AR2 — Association.** Caller-supplied label and supporting-text nodes retain their native IDs/association.
- **AR3 — Reduced motion.** The browser adaptation paints final visual state immediately.

## Design relationships

`family-CM-0021` selects the outlined source route. Figma confirms text/icon variants without overriding Compose geometry. The pinned Material Web shell fills browser implementation details only.

## Family and system relationships

`component:FilledField` owns its distinct filled geometry; both public components share an internal field decoration recipe. The native outlined TextField uses that recipe by default. Core `component:Field` retains its portable contract.

## Verification map

| Contract     | Verification                                   | Representative states                            | Failure expectation                    | Audit section |
| ------------ | ---------------------------------------------- | ------------------------------------------------ | -------------------------------------- | ------------- |
| OF1–OF2, OF4 | Matched pixels and scoped-token browser checks | Light, dark, Expressive, cutout, error           | Geometry or role drift fails.          | Visual.       |
| OF3, AR3     | Independent trajectories and watched clips     | Focus, interrupted blur, refocus, reduced motion | Wrong spring or phase fails.           | Motion.       |
| AR1–AR2, PR1 | Browser semantics and lifecycle checks         | Form, keyboard, validation, RTL, unmount         | A second input or listener leak fails. | Browser.      |

## Decision log

### DEC-1 — Opt-in outlined API

**Reference:** `component:OutlinedField/DEC-1`

**Decider:** `pproenca`, 2026-09-28.

The owner approved publishing an opt-in outlined shell and its exact shared React slots and visual state boundary on 2026-09-28, with Compose's outlined visual recipe. The API decision was reviewed at PR #53 revision `678741a555928e1bf0efc2592b7459e27361d9c6`; native implementation QA is a separate workbook gate.

## Open questions

No open public API question. Native source-motion limits, pixels, and interactive acceptance remain separate workbook decisions.

## Content boundary

This record owns the public outlined shell. The `verified_by` source probe checks the selected motion route, not the pending native implementation. Source research stays in `family-CM-0021`; native acceptance and task status stay in the sole migration workbook.
