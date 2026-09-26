// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose, kit and Web state sources plus light/dark static references. @output Default opacity disagreement and filled Button state binding evidence. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const web = read(
  '../../../packages/themes/material3/src/material3MotionSource.json',
);
const figma = read('../sources/figma-kit-inventory.json');
const reference = read('../sources/state-reference/manifest.json');
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

test('light/dark state captures bind the filled Button to Compose colors and kit styles', () => {
  assert.equal(reference.composeCommit, policy.androidxCommit);
  assert.equal(reference.figmaSha256, policy.figmaSha256);
  assert.equal(reference.webCommit, policy.materialWebCommit);
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  for (const name of ['Ripple', 'Surface', 'Button']) {
    const source = compose.families.find(item => item.name === name);
    assert.deepEqual(reference.sourceFiles[name], {
      path: source.path,
      sha256: source.sha256,
    });
  }
  assert.deepEqual(reference.stateOpacity, {
    hover: 0.08,
    focus: 0.1,
    pressed: 0.1,
    dragged: 0.16,
  });
  assert.deepEqual(reference.disabled, {
    containerOpacity: 0.1,
    labelOpacity: 0.38,
  });
  assert.equal(
    reference.font.sha256,
    'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134',
  );
  for (const mode of ['light', 'dark']) {
    const sample = reference.cases[mode];
    assert.equal(sample.generic.length, 5);
    assert.equal(sample.button.length, 5);
    for (const [name, nodeId] of Object.entries(sample.kitBindings)) {
      const variable = figma.variables.find(item => item.name === name);
      assert.equal(variable?.node_id, nodeId);
      const role = name.includes('/On Primary/') ? 'onPrimary' : 'onSurface';
      const alpha = Number(name.slice(-2)) / 100;
      assert.equal(
        variable[mode],
        `${sample.theme[role].toUpperCase()} / ${alpha}`,
      );
    }
    assert.equal(Object.keys(sample.kitBindings).length, 6);
    assert.equal(sample.button[0].fill, sample.theme.primary);
    assert.equal(sample.button[0].label, sample.theme.onPrimary);
    const image = readFileSync(
      new URL(`../sources/state-reference/state-${mode}.png`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(image).digest('hex'),
      reference.files[`state-${mode}.png`],
    );
    const png = PNG.sync.read(image);
    assert.deepEqual([png.width, png.height], [1180, 560]);
  }
});
