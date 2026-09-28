// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Five-style Button source route, frozen Figma sets and watched motion evidence.
 * @output Source ownership, media integrity and interruption/snap regression.
 * @position Migration-only evidence test before native Button implementation.
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
const bytes = relative =>
  readFileSync(new URL(`../../../${relative}`, import.meta.url));
const sha256 = input => createHash('sha256').update(input).digest('hex');
const policy = read('../policy.json');
const family = read('../sources/families/family-CM-0002.json');
const decision = read('../sources/baseline/button-compose-first.json');
const figma = read('../sources/figma-kit-inventory.json');
const shape = read('../sources/button-reference/button-shape-motion.json');
const browserShape = read(
  '../sources/button-reference/browser-button-shape-motion.json',
);
const shapeRender = read('../sources/button-reference/render-manifest.json');
const elevation = read(
  '../sources/button-reference/button-elevation-motion.json',
);
const elevationRender = read(
  '../sources/button-reference/elevation-render-manifest.json',
);

test('one Compose-first Button family covers five styles and 250 frozen kit variants', () => {
  validateSource(decision, policy);
  validateFamilyUse(decision, [family]);
  assert.equal(family.familyId, 'family-CM-0002');
  assert.deepEqual(family.overrides, []);
  assert.deepEqual(
    Object.values(family.routes).map(route => route.primary),
    ['compose', 'compose', 'compose', 'web'],
  );
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  const nodeIds = [
    '57994:2227',
    '58650:9294',
    '58650:10213',
    '58650:8094',
    '58651:11237',
  ];
  assert.deepEqual(
    nodeIds.map(
      id => figma.componentSets.find(set => set.node_id === id)?.variants,
    ),
    [50, 50, 50, 50, 50],
  );
  assert.equal(decision.compose.tests.length, 15);
  assert.equal(decision.motion.numeric.traces.length, 0);
});

test('selected source frames and all four watched clips match their pinned hashes', () => {
  assert.equal(decision.scenarios.length, 26);
  for (const scenario of decision.scenarios) {
    const image = bytes(scenario.baseline);
    assert.equal(sha256(image), scenario.baselineSha256, scenario.id);
    const png = PNG.sync.read(image);
    assert.deepEqual(
      [png.width, png.height],
      scenario.id.startsWith('button-state') ? [1180, 560] : [960, 360],
    );
  }
  assert.equal(
    sha256(bytes(decision.motion.reference)),
    decision.motion.sha256,
  );
  for (const item of decision.motion.additionalReferences)
    assert.equal(sha256(bytes(item.file)), item.sha256, item.file);
  assert.equal(
    elevationRender.composeInventorySha256,
    sha256(
      bytes('internal/material3-migration/sources/compose-inventory.json'),
    ),
  );
  assert.equal(elevationRender.schemes.Light.onTonal, '#1d192b');
  assert.equal(elevationRender.schemes.Dark.elevated, '#1d1b20');
  assert.deepEqual(
    shapeRender.styles.find(style => style[0] === 'Outlined'),
    ['Outlined', 'Surface', 'OnSurfaceVariant', 'OutlineVariant'],
  );
  assert.deepEqual(shapeRender.shapeEndpoints, {
    round: {rest: 20, pressed: 8},
    square: {rest: 12, pressed: 8},
  });
});

test('pressed-shape reversals and elevation disable snaps retain timed source behavior', () => {
  const comparison = decision.motion.numeric.sourceComparison;
  assert.equal(
    comparison.approvalReference,
    'human:pproenca:2026-09-28:button-source-limits',
  );
  assert.deepEqual(comparison.limits, {
    shapePosition: 0.0002,
    shapeVelocityPerSecond: 0.002,
    elevationDp: 0.001,
    settlingMs: 0,
    eventTimingMs: 0,
  });
  assert.match(comparison.eventTimingMethod, /zero by construction/);
  for (const [dimension, limit] of Object.entries(comparison.limits))
    assert.ok(comparison.measured[dimension] <= limit, dimension);
  assert.equal(comparison.measured.shapePosition, browserShape.errors.position);
  assert.equal(
    comparison.measured.shapeVelocityPerSecond,
    browserShape.errors.velocity,
  );
  assert.equal(
    comparison.measured.elevationDp,
    Math.max(...Object.values(elevation.browserErrorsDp)),
  );
  assert.equal(shape.samples.length, 61);
  assert.deepEqual(
    shape.inputs.changes.map(change => change.timeMs),
    [0, 120, 160, 600],
  );
  assert.equal(shape.settledAtMs, 1000);
  assert.ok(browserShape.errors.position < 0.00000006);
  assert.ok(browserShape.errors.velocity < 0.00000052);
  assert.equal(browserShape.errors.settlingMs, 0);
  assert.deepEqual(
    elevation.changes.map(change => change.timeMs),
    [0, 80, 140, 220, 240, 360, 500, 580],
  );
  assert.deepEqual(Object.keys(elevation.traces), [
    'Elevated',
    'Filled',
    'Tonal',
  ]);
  const elevated = elevation.traces.Elevated;
  assert.equal(elevated.length, 37);
  assert.ok(elevated.find(sample => sample.timeMs === 80).elevationDp > 2.8);
  assert.ok(elevated.find(sample => sample.timeMs === 140).elevationDp < 1.5);
  assert.equal(elevated.find(sample => sample.timeMs === 500).elevationDp, 0);
  assert.equal(elevated.find(sample => sample.timeMs === 580).elevationDp, 1);
  assert.ok(elevation.browserErrorsDp.Elevated < 0.00001);
});
