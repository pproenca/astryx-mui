// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Resolved FocusRing source decision, pinned frames and independent spring traces.
 * @output Source authority, image integrity and approved motion comparison regression.
 * @position Migration-only source evidence before native FocusRing implementation.
 */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateSource} from '../evidence.mjs';
import {compareTrace} from '../measurements.mjs';
import {validateFamilyUse} from '../routing.mjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const decision = read('../sources/baseline/focus-compose-first.json');
const family = read('../sources/families/family-CM-0023.json');
const policy = read('../policy.json');

test('FocusRing source decision retains pinned authority and every selected frame', () => {
  validateSource(decision, policy);
  validateFamilyUse(decision, [family]);
  assert.equal(decision.scenarios.length, 26);
  for (const scenario of decision.scenarios) {
    const image = readFileSync(
      new URL(`../../../${scenario.baseline}`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(image).digest('hex'),
      scenario.baselineSha256,
      scenario.id,
    );
  }
});

test('independent browser traces fit owner-approved FocusRing limits', () => {
  const expectedApproval =
    'human:pproenca:2026-09-27:M3-GAP-011-focus-motion-limits';
  const actualPaths = {
    'standard-fast-focus':
      '../sources/indication-reference/browser-standard-focus.json',
    'expressive-fast-focus':
      '../sources/indication-reference/browser-expressive-focus.json',
  };
  for (const trace of decision.motion.numeric.traces) {
    assert.equal(trace.approvalReference, expectedApproval);
    assert.equal(trace.positionTolerance, 0.0002);
    assert.equal(trace.velocityTolerance, 0.002);
    assert.equal(trace.settlingToleranceMs, 0);
    const comparison = compareTrace(
      read(`../../../${trace.reference}`),
      read(actualPaths[trace.id]),
      trace,
      policy.androidxCommit,
    );
    assert.ok(comparison.positionError <= trace.positionTolerance);
    assert.ok(comparison.velocityError <= trace.velocityTolerance);
    assert.equal(comparison.settlingErrorMs, 0);
  }
});
