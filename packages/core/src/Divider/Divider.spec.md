---
schema_version: 3
template_version: 3
kind: component
id: component:Divider
authority: draft
archive_reason: null
superseded_by: null
approved_by: null
approved_at: null
owners: [cixzhang]
review_triggers: [theming, public-api, accessibility, styling]
verified_by:
  [packages/core/src/Divider/Divider.test.tsx, scripts/check-knowledge.mjs]
modules: []
families: []
design_specs: []
architecture:
  [architecture:component-theming-surface, architecture:container-padding]
contributing: []
system_specs: []
---

# Divider component contract

## Intent

Divider presents a separator group as one rule, or as two rules around an
optional label. This draft proposes additive inset and decorative controls so
the Material 3 theme can reproduce the pinned Material Web divider while
keeping released Core defaults. Its current factual anatomy remains recorded
below; the proposed behavior is not authoritative until owner promotion.

## Compatibility and migration

- Released default preserved: `yes`
- Compatibility class: additive `inset` and `isDecorative` props; existing
  separator semantics, color, thickness, and layout remain the defaults
- Controlled/uncontrolled behavior: not applicable
- Migration decision: use `isDecorative` for a non-semantic rule and choose a
  logical inset only when needed by the layout

Consumer migration instructions belong in consumer docs and release notes.

## Ownership boundary

**Owns**

- The separator group, its current `divider` target, the painted rule segments,
  and the optional label placement.

**Does not own / non-goals**

- The meaning of the content regions separated by the divider, which is owned by
  the product callsite.
- Container inset publication or structural page regions. Divider only reads
  inherited container geometry when `isFullBleed` is enabled.
- Whether Rule or Label should gain public targets, which remains unresolved.

## Public concepts

`inset="both"`, `"start"`, and `"end"` apply a 16px logical inset in the
Material 3 theme. Omission remains full width. `isDecorative` removes the
separator role and naming attributes; it does not hide a visible label.
Consumer syntax remains in `Divider.doc.mjs`.

## Behavioral and layout contract

| ID  | Invariant                                                                                        | Basis                           |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| FR1 | The render contains one rule without a label and two rules with the optional label between them. | Current source, docs, and tests |
| FR2 | The divider group carries the `divider` target; Rule and Label have no public target.            | Current source, docs, and tests |
| FR3 | Optional insets use logical edges and preserve a full-width default.                             | Material Web source and tests   |
| FR4 | Decorative rules omit separator semantics; semantic rules retain the Core default.               | Material Web source and tests   |

### Allowed variation

- Orientation, visual weight, full-bleed layout, inset, and label content may vary
  without changing the three-part anatomy recorded here.
- A long label may wrap within the available width; it must not widen the
  divider beyond its container.

### Representative states

- Unlabelled horizontal and vertical dividers render one Rule.
- Labelled horizontal and vertical dividers render Label between two instances
  of Rule.

### Transformation and precedence order

- The Material 3 theme's divider mapping supplies source-backed color,
  thickness, and inset distance. `variant="strong"` continues to select the
  Astryx emphasized border. `isFullBleed` continues to extend to container
  edges; the optional inset applies inside that span.

### Performance and resources

- No new performance or resource rule is introduced.

## Accessibility contract

The default retains `role="separator"`, its orientation, and an accessible name
from `label` or an explicit ARIA name. `isDecorative` renders a presentational
group without those separator attributes; visible label content remains in the
tree.

## Design relationships

| Anatomy or state | Design requirement                                                | Representation authority       | Hierarchy role | Component contract |
| ---------------- | ----------------------------------------------------------------- | ------------------------------ | -------------- | ------------------ |
| Divider group    | Arranges the separator's rule segments and optional label.        | Current source and public docs | Supporting     | FR1, FR2           |
| Rule             | Paints the separator line in the selected orientation and weight. | Current source and public docs | Supporting     | FR1, FR2           |
| Label            | Presents optional content between two rule segments.              | Current source and public docs | Prominent      | FR1, FR2           |

### Theming anatomy

<!-- anatomy-theming:v1 -->

```json
{
  "Divider group": {"target": "divider"},
  "Rule": {
    "none": {
      "reason": "unsettled: No current public target reaches this part"
    }
  },
  "Label": {
    "none": {
      "reason": "unsettled: No current public target reaches this part"
    }
  }
}
```

The two `none` dispositions record current reachability while target exposure
remains unsettled. They do not decide that Rule or Label should remain without
public targets. The Material 3 theme sets divider-local CSS variables on the
existing group target; it does not expose new Rule or Label targets.

## Family and system relationships

`family:layout-regions` does not own Divider: separating content is not a
structural page-region contract. `architecture:container-padding` owns the
inherited inset geometry that Divider reads only when `isFullBleed` is enabled.
`architecture:component-theming-surface` owns anatomy qualification, target
mapping, and the difference between factual reachability and intended public
theming API.

## Verification map

| Contract            | Verification                                     | Representative states                | Mutation or failure expectation                                                          | Audit section           |
| ------------------- | ------------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------- |
| FR1                 | `Divider.test.tsx` structure and label suites    | Labelled and unlabelled; both axes   | Removing or reordering Rule or Label instances fails child-count and content assertions. | `audit:Divider/anatomy` |
| FR2                 | Source inspection and current target inventories | Group, Rule, and Label               | Adding a target without updating the anatomy map fails repository checks.                | `audit:Divider/theming` |
| FR3                 | Divider tests and Material 3 browser gallery     | No inset, both, start, end; LTR/RTL  | A non-logical inset or changed full-width default fails rendered geometry checks.        | `audit:Divider/layout`  |
| FR4                 | Divider accessibility tests                      | Semantic/decorative, label/ARIA      | An unwanted separator role or lost visible label fails role/name checks.                 | `audit:Divider/a11y`    |
| Theming anatomy map | `scripts/check-knowledge.mjs`                    | Canonical anatomy and current target | Missing, extra, prefixed, stale, or alias-backed mappings fail repository validation.    | `audit:Divider/theming` |

## Decision log

- 2026-09-26: The owner selected additive Core props for Material 3 divider
  parity. The pinned [Material Web divider documentation](https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/docs/components/divider.md)
  defines a decorative default, 16px insets, outline-variant color, and 1px
  thickness. Astryx keeps its released semantic default and opts into the
  Material Web behavior per callsite.

## Open questions

- **OQ1 — Should Rule or Label gain stable public theming targets?** (`human-api`)
  Their target exposure is unsettled; the current lack of reachability does not
  decide the answer.

## Content boundary

This file does not duplicate consumer prop tables/examples, current audit
results, implementation steps, or system rules. It links to their owners.
