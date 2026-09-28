---
schema_version: 3
template_version: 6
kind: component
id: component:Material3Button
authority: draft
archive_reason: null
superseded_by: null
approved_by: null
approved_at: null
owners: [pproenca]
review_triggers: [public-api, behavior, layout, theming, accessibility, motion]
verified_by: []
modules: []
families: []
design_specs: []
architecture: [architecture:public-component-api]
contributing: []
system_specs: [spec:AST-002, spec:AST-013, spec:AST-020]
---

# Native Material 3 Button contract

## Contract at a glance

| Area                    | Proposed contract                                                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public contract         | Additive `Material3Button`, `ElevatedButton`, `FilledTonalButton`, `OutlinedButton`, and `TextButton` exports from `@astryxdesign/material3`, with one shared `Material3ButtonProps` type. `Material3Button` is the filled style, corresponding to pinned Compose `Button`. |
| Behavior                | Each export is a complete control. It owns its source colors, size and shape, elevation, Ripple, focus indication, and interaction motion. An action renders a native `button`; a destination renders a native link.                                                        |
| End-user impact         | The five Material emphasis levels and Standard/Expressive states can be used directly, including keyboard, touch, form, and loading behavior.                                                                                                                               |
| Builder impact          | Callers provide an action or destination, visible children, and optional leading/trailing content. They do not assemble indication or shadow layers.                                                                                                                        |
| Compatibility/readiness | Additive native proposal. Released Core Button and the Material 3 Core theme bridge remain separate compatibility surfaces. Source QA is approved; native QA is still pending in the sole migration workbook.                                                               |
| Review checks           | Reject a compulsory Core wrapper, a single variant prop that obscures the five Compose names, caller-wired Ripple/FocusRing/Elevation, or Web visual defaults replacing specified Compose values.                                                                           |
| Governing rules         | `theme:material3`, pinned `family-CM-0002`, `architecture:public-component-api`, `spec:AST-002`, `spec:AST-013`, and `spec:AST-020`.                                                                                                                                        |

## Intent

Provide the five pinned Compose Material 3 Button styles as complete native React controls. Pinned Compose owns design, defaults, states, and motion; frozen Figma confirms the five-size round/square matrix; Material Web and web standards supply browser link and form semantics. The filled export uses `Material3Button` because `component:Button` is already the Core family's canonical owner in current cross-component records. The five native exports share one implementation and decision.

## Compatibility and migration

- Released default preserved: no existing native Button export; Core `@astryxdesign/core/Button` stays available.
- Compatibility class: additive native exports, with no Core prop or token adapter.
- Controlled/uncontrolled behavior: loading and disabled are caller-controlled; press, hover, focus modality, and motion are component-owned.
- Migration decision: DEC-1 is a proposed public API awaiting engineering-owner review.

## Ownership boundary

**Owns**

- Five Compose style recipes, their state colors, outlines and elevation, default 58 × 40 dp small geometry, five Expressive sizes, icon spacing, round/square shapes, and optional pressed-shape morph.
- Built-in bounded Ripple, visual focus, interaction elevation, interrupted/reversed motion, and reduced-motion finish.
- Native button activation, link destination, form attributes, disabled and loading presentation.

**Does not own / non-goals**

- Application mutations, navigation routing, promise lifecycle, or validation results.
- Toggle, icon-only, group, segmented, or split Button APIs; their source mappings remain separate.
- Core Button's `label`, `variant`, `clickAction`, `isLoading`, or `SizeProvider` contract.

## Public concepts

| Concept        | Closed values or states                                                 | Meaning                                                                  | Availability                            | Default                        | Owner                                           | Stability | Invalid-value behavior                                                |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------- | ------------------------------ | ----------------------------------------------- | --------- | --------------------------------------------------------------------- |
| Style          | Five named exports                                                      | Compose emphasis and surface recipe                                      | Standard and Expressive                 | `Material3Button` means filled | Native component                                | Proposed  | TypeScript import error.                                              |
| Content        | `children: ReactNode`; optional `leadingIcon`, `trailingIcon`           | Visible content and owned icon lanes                                     | All styles                              | Icons absent                   | Caller content; native layout                   | Proposed  | Empty accessible name fails browser QA.                               |
| Size           | `extraSmall`, `small`, `medium`, `large`, `extraLarge`                  | Compose five-size geometry                                               | All styles                              | `small`                        | Native component                                | Proposed  | TypeScript rejects other values.                                      |
| Shape          | `shape?: 'round' \| 'square'`; `pressedShape?: 'round' \| 'square'`     | Resting shape and optional Expressive morph target                       | All styles and sizes                    | Round, static                  | Native component                                | Proposed  | TypeScript rejects other values.                                      |
| State          | `disabled?: boolean`; `loading?: boolean`                               | Prevent activation and show source-appropriate disabled or pending paint | Actions; link loading blocks activation | `false`                        | Caller intent; native paint                     | Proposed  | TypeScript rejects other values.                                      |
| Destination    | `href`, `target`, `rel`                                                 | Native link semantics                                                    | Every style                             | Absent, so native button       | Caller                                          | Proposed  | Action-only form attributes are rejected in link mode.                |
| Form           | `type`, `name`, `value`, `form` and native button attributes            | Native form behavior                                                     | Action mode                             | `type='button'`                | Browser                                         | Proposed  | Destination and form attributes are a TypeScript-discriminated union. |
| Escape hatches | `className`, `style`, supported DOM/ARIA/data attributes, events, `ref` | Caller-owned integration and styling                                     | All                                     | Absent                         | Caller with component-owned semantic safeguards | Proposed  | React and TypeScript rules apply.                                     |

The shared type is a discriminated union of action and destination props. `onClick` remains a synchronous native event callback; the component does not invent an Action or infer loading from its return value. The default `loading` indicator keeps the visible label and outer dimensions, sets `aria-busy`, and prevents duplicate activation. The exact indicator appearance is source-checked in native QA; it does not claim a pinned Compose Button loading overload.

## Behavioral and layout contract

| ID  | Candidate invariant                                                                                                                                                    | Basis                                                             | Draft review state                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| MB1 | All five exports MUST use their pinned Compose style roles, 40 dp small height, 58 dp small minimum width, and corresponding extra-small through extra-large geometry. | `family-CM-0002` and pinned size/style tokens.                    | Source backed; verify native.        |
| MB2 | Ordinary usage MUST include Ripple, focus indication, style-specific elevation, and state paint automatically.                                                         | Current `theme:material3` complete-control decision.              | Current boundary; verify native.     |
| MB3 | `pressedShape` MUST select the pinned DefaultEffects morph and preserve interruption/reversal; without it the resting shape stays static.                              | Pinned Compose `ButtonShapes` overload and watched motion.        | Source backed; verify native.        |
| MB4 | Native button and link modes MUST preserve browser keyboard, pointer, form, focus, and cancellation behavior.                                                          | Pinned Material Web and web standards.                            | Browser verification pending.        |
| MB5 | Loading MUST keep geometry and accessible purpose stable, expose busy state, and block duplicate activation until the caller clears it.                                | Workbook pilot requirement; no Compose loading overload selected. | Explicit browser gap; verify native. |

### Allowed variation

- **AV1 — Theme.** Scoped Material roles alter colors and typography without changing style meaning.
- **AV2 — Content.** Optional icon lanes close when absent; caller content may include styled text or images while the component retains control geometry.
- **AV3 — Browser integration.** A router link component may be supplied through the package's supported link seam once that seam has a separate contract; native `href` is the initial mode.

### Representative states

| State                                                  | Required invariant                                  | Allowed variation                   |
| ------------------------------------------------------ | --------------------------------------------------- | ----------------------------------- |
| Five styles × five sizes × round/square                | Source geometry, roles, content alignment           | Visible content and theme.          |
| Rest, hover, focus, press, disabled, loading           | Complete component-owned visual and action behavior | Caller-controlled disabled/loading. |
| Standard, Expressive, light, dark                      | Selected spring and color roles                     | Theme profile.                      |
| Keyboard, touch, form, link, RTL, zoom, reduced motion | Native semantics and logical layout                 | Platform rendering.                 |

### Transformation and precedence order

- **ORD1 — Style.** The named export selects a pinned Compose style recipe; size selects matching dimensions and shape tokens.
- **ORD2 — State.** Disabled and loading prevent action; a supplied pressed shape changes only the geometric press path. Interaction state controls Ripple, focus, and elevation automatically.
- **ORD3 — Browser.** `href` selects native link semantics; otherwise native button and form behavior apply. Browser rules never replace Compose visual values.

### Performance and resources

- **PR1 — Motion.** Reuse the native spring and indication engines. Motion is interruptible without timers that outlive the control; reduced motion paints final states immediately.

## Accessibility contract

- **AR1 — One control.** Each export exposes one native button or link with a name supplied by its visible content or caller ARIA. Its decorative layers add no tab stop or role.
- **AR2 — Disabled and loading.** Disabled actions cannot activate or enter the tab order; loading keeps the purpose and indicates busy state without duplicate submission.
- **AR3 — Focus.** Keyboard focus has an observable Material indication; pointer focus follows browser modality. Touch targets and contrast are verified per style and size.

## Design relationships

The five-style, five-size, round/square matrix follows `family-CM-0002`. The optional pressed-shape path is Compose's Expressive overload rather than a theme-wide animation forced on Standard usage. Figma's frozen axes confirm coverage; no exact-value override is selected.

## Family and system relationships

`theme:material3` owns the token graph and native boundary. The standalone `component:Ripple`, `component:FocusRing`, and `component:Elevation` are opt-in tools for custom controls; this Button owns equivalent internal presentation. Core `family:buttons` and `component:Button` references remain scoped to the released Core family.

## Verification map

| Contract          | Verification                                                                                               | Representative states                                              | Failure expectation                                           | Audit section      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------ |
| MB1–MB3           | Matched source/native browser pixels, token overrides, independent trajectory comparison and watched clips | Five styles, sizes, light/dark, press interruption, reduced motion | Geometry, color, shape, or motion drift fails.                | Visual and motion. |
| MB2, MB4, AR1–AR3 | Real-browser pointer/keyboard/form/link checks and accessibility tree                                      | Click, Enter, Space, submit/reset, focus, disabled, loading, RTL   | Missing native semantics or component-owned indication fails. | Browser.           |
| MB5, PR1          | Controlled loading and teardown checks                                                                     | Duplicate action, busy state, unmount                              | Extra activation, layout shift, or retained animation fails.  | Interaction.       |

## Decision log

### DEC-1 — Five named complete controls

**Reference:** `component:Material3Button/DEC-1`

**Decider:** pending engineering-owner API review.

Pinned Compose exposes five named composables sharing one implementation family. This draft proposes five React exports with one shared prop type, five size values, optional Expressive pressed shape, native form/link modes, and caller-controlled loading. The filled export is named `Material3Button` to preserve the existing Core `component:Button` owner. Existing Core Button props are not carried into the native package automatically.

**Source evidence:** `internal/material3-migration/sources/families/family-CM-0002.md` and `internal/material3-migration/sources/baseline/button-compose-first.json`. Source QA was approved at PR #51 revision `d908e8193a93a69a70669466a91fc633328361a7`; native QA remains in `M3-CMP-001`.

## Open questions

- **OQ1 — Does the engineering owner approve the five named exports and shared action/link/content/shape/loading prop boundary above?** (`human-api`)

## Content boundary

This draft owns the proposed native Button API and component behavior. Source research stays in `family-CM-0002`; native acceptance and task status stay in the sole migration workbook.
