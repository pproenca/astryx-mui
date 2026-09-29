---
schema_version: 3
template_version: 6
kind: component
id: component:FilledField
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

# FilledField component contract

## Contract at a glance

| Area                    | Contract                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contract         | Additive `FilledField` and `FilledFieldProps` exports from `@astryxdesign/material3`. Required `children`; optional `label`, `supportingText`, `leadingIcon`, `trailingIcon`, `prefix`, `suffix`, `focused`, `populated`, `disabled`, and `error`. The React content slots accept `ReactNode`; the visual state props are booleans. |
| Behavior                | Paint Compose's filled decoration around a caller-owned control. A nested focus target is observed by default; an explicit `focused` value overrides that visual observation. `populated`, `disabled`, and `error` are caller-supplied visual state.                                                                                |
| End-user impact         | A custom input can display Material 3 filled decoration without becoming a second form control.                                                                                                                                                                                                                                     |
| Builder impact          | The caller supplies the semantic input, its label/description association, value, validity, disabled behavior, and populated state. Standard native text fields will integrate this decoration themselves.                                                                                                                          |
| Compatibility/readiness | Additive native API approved on 2026-09-28; no released Core API changes. Native motion limits were approved on 2026-09-29; pixel and interactive workbook acceptance remain pending.                                                                                                                                               |
| Review checks           | Reject a Core Field wrapper, duplicated semantic input, automatic form behavior, caller-assembled decoration for standard native controls, Web values replacing specified Compose values, or an unreviewed pixel tolerance.                                                                                                         |
| Governing rules         | `theme:material3`, pinned `family-CM-0021`, `architecture:public-component-api`, `spec:AST-002`, `spec:AST-020`.                                                                                                                                                                                                                    |

## Intent

Offer Compose's filled TextField decoration recipe as an opt-in visual shell for an advanced custom control. Pinned Compose's `TextFieldDefaults` supplies the visual and motion route; Material Web and native web standards supply browser semantics. The shared field source decision covers this export and its outlined sibling.

## Compatibility and migration

- Released default preserved: not yet released.
- Compatibility class: additive native export; Core Field and TextInput remain available.
- Controlled/uncontrolled behavior: visual `populated`, `disabled`, and `error` are controlled by the caller. Visual focus uses the nested focus target when `focused` is omitted.
- Migration decision: DEC-1 is the owner-approved public API.

## Ownership boundary

**Owns**

- Filled container, bottom indicator, inside floating label, supporting-text layout, content lanes, source state colors, and pinned label/indicator/placeholder/affix motion.
- Scoped native Material tokens and reduced-motion visual finish.

**Does not own / non-goals**

- Form submission, input value, edit events, selection, focus placement, validation, announcements, and semantic input attributes; the caller's control owns them.
- A required/optional marker, character counter, or text-area resize policy without a selected Compose source gap.
- Ordinary native TextField assembly; the complete native text control owns this decoration internally.

## Public concepts

| Concept    | Closed values or states                                                      | Meaning                                          | Availability | Default              | Owner                   | Stability      | Invalid-value behavior               |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------ | -------------------- | ----------------------- | -------------- | ------------------------------------ |
| Content    | One caller-owned semantic control                                            | Control painted within the shell                 | All          | Required             | Caller                  | Owner approved | Missing child is a TypeScript error. |
| Slots      | `label`, `supportingText`, `leadingIcon`, `trailingIcon`, `prefix`, `suffix` | Optional visual content in Compose's field lanes | All          | Absent               | `component:FilledField` | Owner approved | React renders supplied content.      |
| Focus      | `focused` boolean or nested focus observation                                | Selects visual focused phase                     | All          | Observe focus within | `component:FilledField` | Owner approved | TypeScript rejects other values.     |
| Population | `populated` boolean                                                          | Keeps a present label floating after blur        | All          | `false`              | Caller                  | Owner approved | TypeScript rejects other values.     |
| Flags      | `disabled`, `error` booleans                                                 | Select source visual states                      | All          | `false`              | Caller                  | Owner approved | TypeScript rejects other values.     |

## Behavioral and layout contract

| ID  | Candidate invariant                                                                                                                                                                                                                                | Basis                                                                                                                                                              | Draft review state             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| FF1 | The default shell MUST use the pinned 56 dp minimum height, 280 dp minimum width subject to parent constraints, filled container, and 1 dp to 2 dp bottom indicator focus change.                                                                  | `family-CM-0021` Compose source route.                                                                                                                             | Source backed; verify native.  |
| FF2 | Label, placeholder, prefix/suffix opacity, indicator thickness and color MUST follow the selected Compose phase and spring paths, including interrupted blur and refocus. Prefix and suffix MUST be hidden when an empty inside label is expanded. | Pinned TextField implementation, `TextFieldTest.testTextField_prefixAndSuffixAndPlaceholder_areNotDisplayed_withLabel_ifLabelCanExpand`, and watched source clips. | Source backed; verify native.  |
| FF3 | A caller-provided visual state MUST NOT mutate the child's input semantics or value.                                                                                                                                                               | Approved shell ownership boundary and web standards.                                                                                                               | Owner approved; verify native. |
| FF4 | Light, dark, Expressive, and scoped overrides MUST consume native Material field roles directly.                                                                                                                                                   | `theme:material3`.                                                                                                                                                 | Source backed; verify native.  |

### Allowed variation

- **AV1 — Theme.** Scoped Material roles change source colors and typography without changing state meaning.
- **AV2 — Content.** The caller may omit optional visual slots; the occupied lanes close without hidden reserve.

### Representative states

| State                                      | Required invariant                                   | Allowed variation                           |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------- |
| Empty, populated, focused, error, disabled | Compose phase, color, indicator, and label treatment | Caller content and semantic input behavior. |
| Standard and Expressive                    | Shared field geometry with selected spring scheme    | Expressive spring response.                 |
| RTL, narrow, zoom                          | Logical content lanes and stable label/control fit   | Parent width constraint.                    |

### Transformation and precedence order

- **ORD1 — State.** Explicit `focused` overrides nested focus observation; `populated` determines the nonempty phase; disabled visuals suppress focused/error paint where the pinned source does.
- **ORD2 — Source.** Compose values and motion win; Figma fills only the recorded variant coverage gaps; browser semantics remain with the input child.

### Performance and resources

- **PR1 — Motion.** Use the shared native motion engine; detach any focus observation on unmount and avoid repeated layout reads during steady state.

## Accessibility contract

- **AR1 — One control.** The shell MUST add no tab stop, role, or form value. The child control remains the only semantic input.
- **AR2 — Caller association.** Slot content may contain a caller-supplied native `label` and supporting-text IDs; the shell MUST preserve it without synthesizing an accessible name or announcement.
- **AR3 — Reduced motion.** The browser reduced-motion adaptation paints each final visual state immediately.

## Design relationships

`family-CM-0021` selects Compose's filled geometry, roles, states, and motion. Figma confirms leading/trailing icons and text configurations without overriding specified values. Material Web supplies the browser shell/integrated-control split.

## Family and system relationships

`component:OutlinedField` owns the outlined sibling. The native filled TextField will consume the shared visual recipe internally; `theme:material3` owns tokens. Core `component:Field` owns only its existing portable contract.

## Verification map

| Contract          | Verification                                                 | Representative states                             | Failure expectation                               | Audit section |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------- | ------------- |
| FF1, FF4          | Matched source/native pixels and scoped-token browser checks | Light, dark, Expressive, focused, error           | Geometry or role drift fails.                     | Visual.       |
| FF2, AR3          | Independent trajectories and watched clips                   | Focus, blur interruption, refocus, reduced motion | Wrong spring or phase fails.                      | Motion.       |
| FF3, AR1–AR2, PR1 | Browser and DOM checks                                       | Form submit, keyboard, validation, RTL, unmount   | A second semantic control or listener leak fails. | Browser.      |

## Decision log

### DEC-1 — Opt-in visual API

**Reference:** `component:FilledField/DEC-1`

**Decider:** `pproenca`, 2026-09-28.

The owner approved publishing opt-in filled and outlined field shells and the exact React slots and visual state boundary on 2026-09-28. The caller's control retains form and accessibility semantics. The API decision was reviewed at PR #53 revision `678741a555928e1bf0efc2592b7459e27361d9c6`; native implementation QA is a separate workbook gate.

## Open questions

No open public API question. Native source-motion limits are recorded in the [field source decision](../../../../internal/material3-migration/sources/baseline/field-compose-first.json). Pixel and interactive acceptance remain separate workbook decisions.

## Content boundary

This record owns the public filled shell. The `verified_by` source probe checks the selected motion route, not the pending native implementation. Source research stays in `family-CM-0021`; native acceptance and task status stay in the sole migration workbook.
