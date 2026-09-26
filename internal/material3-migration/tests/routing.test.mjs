// Copyright (c) Meta Platforms, Inc. and affiliates.

import {test} from 'vitest';
import assert from 'node:assert/strict';
import {
  familyGroups,
  sourcePlan,
  validateFamily,
  validateFamilyUse,
} from '../routing.mjs';

const mapping = (id, compose = '', figma = '', extra = {}) => ({
  'Map ID': id,
  'Material element': id,
  'Compose families': compose,
  'Figma nodes': figma,
  ...extra,
});
const policy = {
  figmaSha256: 'figma',
  androidxCommit: 'compose',
  materialWebCommit: 'web',
};
const coverage = (status = 'present') => ({
  status,
  evidence: 'inventory.json',
  ...(status === 'absent'
    ? {reason: 'Pinned inventory lookup found no equivalent'}
    : {}),
});
function record(group) {
  return {
    schemaVersion: 2,
    authority: 'compose-first',
    familyId: group.id,
    scopeSha256: group.scopeSha256,
    pins: {figma: 'figma', compose: 'compose', web: 'web'},
    coverage: {figma: coverage(), compose: coverage(), web: coverage()},
    routes: {
      design: {
        primary: 'compose',
        figmaSpecified: true,
        evidence: 'design.json',
      },
      behavior: {
        primary: 'compose',
        figmaSpecified: false,
        evidence: 'behavior.json',
      },
      motion: {
        primary: 'compose',
        figmaSpecified: false,
        evidence: 'motion.json',
      },
      browser: {
        primary: 'web',
        figmaSpecified: false,
        evidence: 'browser.json',
      },
    },
  };
}
test('variants share one research owner; kit-node reuse alone never merges semantics', () => {
  const mappings = [
    mapping('CM-0002', 'compose:Button', 'node'),
    mapping('CM-0003', 'compose:Button', 'node'),
    mapping('CM-0004', 'compose:IconButton', 'node'),
  ];
  const groups = familyGroups(mappings);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].mappingIds, ['CM-0002', 'CM-0003']);
  assert.equal(
    sourcePlan(mappings, ['CM-0003'])[0].decision,
    groups[0].decision,
  );
  assert.equal('references' in sourcePlan(mappings, ['CM-0003'])[0], false);
  assert.deepEqual(
    sourcePlan(mappings, ['CM-0003'], true)[0].references.figma,
    ['node'],
  );
});
test('research groups join transitively and preserve filled/outlined child variants', () => {
  const groups = familyGroups([
    mapping('CM-0001', 'compose:A'),
    mapping('CM-0002', 'compose:B'),
    mapping('CM-0003', 'compose:A, compose:B'),
    mapping('CM-0004', 'compose:TextField'),
    mapping('CM-0005', 'compose:OutlinedTextField'),
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].mappingIds, ['CM-0001', 'CM-0002', 'CM-0003']);
  assert.deepEqual(groups[1].mappingIds, ['CM-0004', 'CM-0005']);
});
test('single-platform variants can share an explicitly assigned native owner', () => {
  const groups = familyGroups([
    mapping('CM-0001', '', 'a', {
      'Native export': '@astryxdesign/material3/Foo',
    }),
    mapping('CM-0002', '', 'b', {
      'Native export': '@astryxdesign/material3/Foo',
    }),
    mapping('CM-0003'),
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].mappingIds.length, 2);
});
test('source absence and a skipped primary require evidence; Compose-only has a valid route', () => {
  const group = familyGroups([
    mapping('CM-0001', 'compose:LoadingIndicator'),
  ])[0];
  const r = record(group);
  r.coverage.figma = coverage('absent');
  r.coverage.web = coverage('absent');
  r.routes.design = {
    primary: 'compose',
    figmaSpecified: false,
    evidence: 'design.json',
  };
  r.routes.browser = {
    primary: 'web-platform',
    figmaSpecified: false,
    evidence: 'browser.json',
  };
  validateFamily(r, group, policy);
  r.routes.motion.primary = 'website';
  assert.throws(() => validateFamily(r, group, policy), /higher source/);
  r.routes.motion.gapReason = 'No transition specified in this API';
  r.routes.motion.gapEvidence = 'gap.json';
  assert.ok(validateFamily(r, group, policy).includes('gap.json'));
  r.coverage.figma.reason = '';
  assert.throws(() => validateFamily(r, group, policy), /absence/);
});
test('linked candidates cannot disappear and Figma cannot silently override Compose', () => {
  const group = familyGroups([
      mapping('CM-0001', 'compose:Button', 'figma-node'),
    ])[0],
    r = record(group);
  validateFamily(r, group, policy);
  r.coverage.figma = coverage('absent');
  assert.throws(() => validateFamily(r, group, policy), /candidate links/);
  r.coverage.figma = coverage();
  r.routes.design.primary = 'figma';
  assert.throws(() => validateFamily(r, group, policy), /higher source/);
  r.routes.design.exception = {
    reason: 'Approved newer design correction',
    evidence: 'correction.json',
    approvalReference: 'human decision',
  };
  validateFamily(r, group, policy);
  r.schemaVersion = 1;
  assert.throws(() => validateFamily(r, group, policy), /stale/);
});
test('sibling scope and pinned source changes invalidate shared research', () => {
  const group = familyGroups([mapping('CM-0001', 'compose:Button')])[0],
    r = record(group);
  const expanded = familyGroups([
    mapping('CM-0001', 'compose:Button'),
    mapping('CM-0002', 'compose:Button'),
  ])[0];
  assert.throws(() => validateFamily(r, expanded, policy), /scope/);
  assert.throws(
    () => validateFamily(r, group, {...policy, androidxCommit: 'new'}),
    /pins/,
  );
});

test('Figma-only and Web-only families retain explicit fallback routes', () => {
  const figma = familyGroups([mapping('CM-0001', '', 'node')])[0],
    f = record(figma);
  f.routes.design.primary = 'figma';
  f.coverage.compose = coverage('absent');
  f.coverage.web = coverage('absent');
  f.routes.behavior.primary = 'website';
  f.routes.motion.primary = 'website';
  f.routes.browser.primary = 'web-platform';
  validateFamily(f, figma, policy);
  const web = familyGroups([
      mapping('CM-0002', '', '', {
        'Material element': 'md-focus-ring',
        'Material source': 'pinned-web',
      }),
    ])[0],
    w = record(web);
  w.coverage.figma = coverage('absent');
  w.coverage.compose = coverage('absent');
  for (const concern of ['design', 'behavior', 'motion'])
    w.routes[concern] = {
      primary: 'web',
      figmaSpecified: false,
      evidence: 'web.json',
      gapReason:
        'Captured guidance leaves this implementation detail unspecified',
      gapEvidence: 'guidance-gap.json',
    };
  validateFamily(w, web, policy);
  w.coverage.website = {status: 'absent'};
  assert.throws(() => validateFamily(w, web, policy), /Unknown coverage/);
});
test('task-local reinterpretation fails; a shared dimension exception applies to siblings', () => {
  const group = familyGroups([mapping('CM-0001', 'compose:Button')])[0],
    r = record(group);
  const source = {
    decisions: [{dimension: 'shape', chosen: 'figma', figmaSpecified: true}],
  };
  assert.throws(() => validateFamilyUse(source, [r]), /shared family decision/);
  r.overrides = [
    {
      dimension: 'shape',
      primary: 'figma',
      figmaSpecified: true,
      reason: 'Specific missing Compose dimension',
      evidence: 'shape-gap.json',
      gapReason: 'Shape is absent from the selected Compose API',
      gapEvidence: 'shape-gap.json',
    },
  ];
  validateFamily(r, group, policy);
  validateFamilyUse(source, [r]);
  source.decisions[0].chosen = 'web';
  assert.throws(() => validateFamilyUse(source, [r]), /shared family decision/);
});
