// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Versioned Compose-first decision, policy and 53 source scenarios. @output Source authority and foundation matrix regression. @position Migration-only source baseline test. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateSource} from '../evidence.mjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const source = read('../sources/baseline/compose-first.json');
const policy = read('../policy.json');

test('versioned source decision covers the full pinned foundation matrix', () => {
  validateSource(source, policy);
  assert.equal(source.authority, 'compose-first');
  assert.equal(source.baselineId, policy.baselineId);
  assert.equal(source.compose.commit, policy.androidxCommit);
  assert.equal(source.figma.sha256, policy.figmaSha256);
  assert.equal(source.web.commit, policy.materialWebCommit);
  assert.equal(source.scenarios.length, 53);
  assert.equal(new Set(source.scenarios.map(item => item.id)).size, 53);
  assert.equal(
    source.scenarios.find(item => item.id === 'spacing-density-narrowLight')
      .environment.viewport.width,
    390,
  );
  assert.equal(
    source.scenarios.find(item => item.id === 'spacing-density-rtlDark')
      .environment.direction,
    'rtl',
  );
  for (const dimension of policy.foundationDimensions) {
    assert.ok(source.decisions.some(item => item.dimension === dimension));
    for (const mode of ['light', 'dark'])
      assert.ok(
        source.scenarios.some(
          item =>
            item.dimensions.includes(dimension) &&
            item.environment.theme === mode,
        ),
        `${dimension}/${mode}`,
      );
  }
  assert.equal(
    source.scenarios.filter(item => item.id.startsWith('color-')).length,
    35,
  );
  assert.equal(
    source.scenarios.filter(item => item.id.startsWith('shape-expressive-'))
      .length,
    2,
  );
});

test('every selected source image is pinned, while native thresholds remain explicitly unapproved', () => {
  for (const item of source.scenarios) {
    const image = readFileSync(
      new URL(`../../../${item.baseline}`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(image).digest('hex'),
      item.baselineSha256,
      item.id,
    );
  }
  assert.equal(source.motion.applicable, true);
  assert.equal(source.motion.numeric.applicable, true);
  assert.equal(source.motion.numeric.traces.length, 2);
  assert.ok(
    source.motion.numeric.traces.every(item => item.approvalReference === null),
  );
  assert.equal(source.performance[0].approvalReference, null);
  assert.match(source.performance[0].status, /proposed/);
});
