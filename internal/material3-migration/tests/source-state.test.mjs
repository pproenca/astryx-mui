// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose StateTokens and Material Web state opacity source. @output Exact default state-layer disagreements. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const web = read('../../../packages/themes/material3/src/material3MotionSource.json');
const policy = read('../policy.json');

test('Compose focus and pressed state opacity supersede Web 0.12', () => {
  assert.equal(compose.commit, policy.androidxCommit);
  assert.equal(web.sourceCommit, policy.materialWebCommit);
  const state = compose.tokens.find(file => file.name === 'StateTokens');
  assert.ok(state);
  const selected = Object.fromEntries(
    state.values.map(({name, expression}) => [
      name.replace('StateLayerOpacity', '').toLowerCase(),
      Number(expression.replace(/f$/, '')),
    ]),
  );
  assert.deepEqual(selected, {
    dragged: 0.16,
    focus: 0.1,
    hover: 0.08,
    pressed: 0.1,
  });
  const differences = Object.entries(selected).flatMap(([name, value]) => {
    const webValue = web.stateLayerOpacity[`${name}-state-layer-opacity`];
    return value === webValue ? [] : [[name, value, webValue]];
  });
  assert.deepEqual(differences, [
    ['focus', 0.1, 0.12],
    ['pressed', 0.1, 0.12],
  ]);
});
