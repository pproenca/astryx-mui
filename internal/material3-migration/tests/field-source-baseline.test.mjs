// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Shared field route, frozen kit scope, watched frames and independent browser spring calculation.
 * @output Pinned source ownership, media integrity and approved source comparison checks.
 * @position Migration-only evidence regression before native field implementation.
 */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {validateSource} from '../evidence.mjs';
import {validateFamilyUse} from '../routing.mjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = read('../policy.json');
const family = read('../sources/families/family-CM-0021.json');
const decision = read('../sources/baseline/field-compose-first.json');
const figma = read('../sources/figma-kit-inventory.json');
const manifest = read('../sources/field-reference/manifest.json');
const source = read('../sources/field-reference/field-motion.json');
const browser = read('../sources/field-reference/browser-field-motion.json');

test('one pinned field family owns all four mappings and the frozen 120-variant kit set', () => {
  validateSource(decision, policy);
  validateFamilyUse(decision, [family]);
  assert.equal(family.familyId, 'family-CM-0021');
  assert.equal(family.routes.design.primary, 'compose');
  assert.equal(family.routes.behavior.primary, 'compose');
  assert.equal(family.routes.motion.primary, 'compose');
  assert.equal(family.routes.browser.primary, 'web');
  assert.deepEqual(family.overrides, []);
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  const set = figma.componentSets.find(item => item.node_id === '52798:24373');
  assert.equal(set?.name, 'Text field');
  assert.equal(set?.variants, 120);
  assert.equal(decision.compose.tests.length, 8);
  assert.equal(decision.motion.numeric.traces.length, 0);
});

test('every selected field frame and both clips retain the watched source hashes', () => {
  assert.equal(manifest.composeCommit, policy.androidxCommit);
  assert.equal(manifest.figmaSha256, policy.figmaSha256);
  assert.equal(manifest.webCommit, policy.materialWebCommit);
  assert.equal(decision.scenarios.length, 22);
  assert.equal(Object.keys(manifest.images).length, 22);
  for (const scenario of decision.scenarios) {
    const bytes = readFileSync(
      new URL(`../../../${scenario.baseline}`, import.meta.url),
    );
    assert.equal(hash(bytes), scenario.baselineSha256, scenario.id);
    assert.equal(
      manifest.images[scenario.baseline.split('/').at(-1)],
      scenario.baselineSha256,
    );
    const png = PNG.sync.read(bytes);
    assert.deepEqual([png.width, png.height], [960, 420], scenario.id);
  }
  for (const [name, expected] of Object.entries(manifest.clips)) {
    const bytes = readFileSync(
      new URL(`../sources/field-reference/${name}`, import.meta.url),
    );
    assert.equal(hash(bytes), expected, name);
  }
  assert.equal(
    decision.motion.sha256,
    manifest.clips['compose-field-light.mp4'],
  );
  assert.equal(
    decision.motion.secondReference.sha256,
    manifest.clips['compose-field-dark.mp4'],
  );
});

test('Chrome field spring errors and settling are independently recomputable', () => {
  const comparison = decision.motion.numeric.sourceComparison;
  assert.equal(comparison.approvalReference, 'human:pproenca:2026-09-29:field-source-limits');
  assert.deepEqual(comparison.limits, {
    interpolationPosition: 0.0002,
    interpolationVelocityPerSecond: 0.002,
    indicatorDp: 0.001,
    indicatorVelocityDpPerSecond: 0.002,
    settlingMs: 0,
    eventTimingMs: 0,
  });
  assert.match(comparison.eventTimingMethod, /zero by construction/);
  for (const [dimension, limit] of Object.entries(comparison.limits))
    assert.ok(comparison.measured[dimension] <= limit, dimension);
  const sourceBytes = readFileSync(
    new URL('../sources/field-reference/field-motion.json', import.meta.url),
  );
  assert.equal(hash(sourceBytes), manifest.motionSha256);
  assert.equal(browser.referenceSha256, manifest.motionSha256);
  assert.equal(source.composeCommit, policy.androidxCommit);
  assert.equal(browser.composeCommit, policy.androidxCommit);
  assert.equal(source.stepMs, 20);
  assert.equal(source.endMs, 1600);
  assert.deepEqual(Object.keys(source.schemes), ['standard', 'expressive']);
  for (const [scheme, properties] of Object.entries(source.schemes)) {
    assert.deepEqual(Object.keys(properties), [
      'label',
      'placeholder',
      'indicator',
      'color',
    ]);
    for (const [property, reference] of Object.entries(properties)) {
      const actual = browser.schemes[scheme][property];
      assert.equal(reference.samples.length, 81);
      assert.equal(actual.samples.length, 81);
      assert.deepEqual(
        reference.changes.map(change => change.timeMs),
        [0, 120, 160, 600],
      );
      assert.equal(reference.settledAtMs, actual.settledAtMs);
      const position = Math.max(
        ...reference.samples.map((sample, index) =>
          Math.abs(sample.position - actual.samples[index].position),
        ),
      );
      const velocity = Math.max(
        ...reference.samples.map((sample, index) =>
          Math.abs(sample.velocity - actual.samples[index].velocity),
        ),
      );
      assert.equal(actual.errors.position, position);
      assert.equal(actual.errors.velocity, velocity);
      assert.equal(actual.errors.settlingMs, 0);
    }
  }
  assert.equal(source.schemes.standard.label.settledAtMs, 980);
  assert.equal(source.schemes.expressive.label.settledAtMs, 1360);
  const measured = {
    interpolationPosition: 0,
    interpolationVelocityPerSecond: 0,
    indicatorDp: 0,
    indicatorVelocityDpPerSecond: 0,
    settlingMs: 0,
    eventTimingMs: 0,
  };
  for (const group of Object.values(browser.schemes))
    for (const trace of Object.values(group)) {
      const position = trace.unit === 'dp' ? 'indicatorDp' : 'interpolationPosition';
      const velocity = trace.unit === 'dp' ? 'indicatorVelocityDpPerSecond' : 'interpolationVelocityPerSecond';
      measured[position] = Math.max(measured[position], trace.errors.position);
      measured[velocity] = Math.max(measured[velocity], trace.errors.velocity);
      measured.settlingMs = Math.max(measured.settlingMs, trace.errors.settlingMs);
    }
  assert.deepEqual(comparison.measured, measured);
});
