// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Resolved Ripple source decision, pinned browser frames and independent Chrome interpolation.
 * @output Source routing, frame integrity and owner-approved motion-limit regression.
 * @position Migration-only source evidence before native Ripple implementation.
 */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateSource} from '../evidence.mjs';
import {validateFamilyUse} from '../routing.mjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const bytes = relative =>
  readFileSync(new URL(`../../../${relative}`, import.meta.url));
const sha256 = input => createHash('sha256').update(input).digest('hex');
const decision = read('../sources/baseline/ripple-compose-first.json');
const family = read('../sources/families/family-CM-0023.json');
const policy = read('../policy.json');
const comparison = read(
  '../sources/ripple-reference/browser-ripple-motion.json',
);

test('Ripple source decision retains pinned authority and every selected frame', () => {
  validateSource(decision, policy);
  validateFamilyUse(decision, [family]);
  assert.equal(decision.scenarios.length, 48);
  for (const scenario of decision.scenarios) {
    assert.equal(
      sha256(bytes(scenario.baseline)),
      scenario.baselineSha256,
      scenario.id,
    );
  }
  assert.equal(
    sha256(bytes(decision.motion.reference)),
    decision.motion.sha256,
  );
  assert.equal(
    sha256(bytes(decision.motion.stateLayerReference)),
    decision.motion.stateLayerSha256,
  );
});

test('independent browser interpolation fits owner-approved Ripple limits', () => {
  assert.equal(comparison.source.composeCommit, policy.androidxCommit);
  assert.equal(comparison.producer.kind, 'browser');
  assert.equal(comparison.producer.sampleStepMs, 5);
  assert.equal(comparison.press.traces, 6);
  assert.equal(comparison.press.samples, 456);
  assert.equal(comparison.state.samples, 195);
  const traces = decision.motion.numeric.traces;
  assert.equal(traces.length, 2);
  const [press, state] = traces;
  const approval = 'human:pproenca:2026-09-27:M3-GAP-013-ripple-motion-limits';
  assert.equal(press.approvalReference, approval);
  assert.equal(state.approvalReference, approval);
  assert.deepEqual(
    [
      press.positionTolerance,
      press.velocityTolerance,
      press.alphaTolerance,
      press.alphaVelocityTolerance,
      press.settlingToleranceMs,
    ],
    [0.001, 0.2, 0.000001, 0.0005, 0],
  );
  assert.deepEqual(
    [
      state.positionTolerance,
      state.velocityTolerance,
      state.settlingToleranceMs,
    ],
    [0.000001, 0.0005, 0],
  );
  assert.ok(comparison.press.errors.radiusPx <= press.positionTolerance);
  assert.ok(comparison.press.errors.centerPx <= press.positionTolerance);
  assert.ok(comparison.press.errors.pxPerSecond <= press.velocityTolerance);
  assert.ok(comparison.press.errors.alpha <= press.alphaTolerance);
  assert.ok(
    comparison.press.errors.alphaPerSecond <= press.alphaVelocityTolerance,
  );
  assert.equal(comparison.press.settledAtMs, 675);
  assert.ok(comparison.state.errors.alpha <= state.positionTolerance);
  assert.ok(comparison.state.errors.alphaPerSecond <= state.velocityTolerance);
  assert.equal(comparison.state.settledAtMs, 970);
});
