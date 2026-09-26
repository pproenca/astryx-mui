// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose and kit inventories plus light/dark spacing diagrams. @output Regression evidence for Button and TextField default geometry. @position Migration-only source decision test. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-kit-inventory.json');
const reference = read('../sources/spacing-reference/manifest.json');
const policy = read('../policy.json');

test('Button and TextField geometry is pinned to Compose, with the precision branch opt-in', () => {
  assert.equal(reference.composeCommit, policy.androidxCommit);
  assert.equal(reference.figmaSha256, policy.figmaSha256);
  assert.equal(compose.commit, policy.androidxCommit);
  const token = name =>
    new Map(
      compose.tokens
        .find(item => item.name === name)
        .values.map(({name: key, expression}) => [key, expression]),
    );
  const small = token('ButtonSmallTokens');
  const baseline = token('BaselineButtonTokens');
  assert.equal(small.get('ContainerHeight'), '40.0.dp');
  assert.equal(small.get('LeadingSpace'), '16.0.dp');
  assert.equal(small.get('IconLabelSpace'), '8.0.dp');
  assert.equal(baseline.get('LeadingSpace'), '24.0.dp');
  assert.equal(
    token('OutlinedTextFieldTokens').get('ContainerHeight'),
    '56.0.dp',
  );
  const geometry = reference.cases.light.geometry;
  assert.deepEqual(geometry.baselineButton, {
    minWidth: 58,
    height: 40,
    inline: 24,
    block: 8,
    icon: 18,
  });
  assert.deepEqual(geometry.expressiveSmallButton, {
    minWidth: 58,
    height: 40,
    inline: 16,
    block: 10,
    icon: 20,
    iconLabelGap: 8,
  });
  assert.deepEqual(geometry.textField, {
    minWidth: 280,
    minHeight: 56,
    inline: 16,
    withLabelBlock: 8,
    withoutLabelBlock: 16,
  });
  assert.deepEqual(geometry.precisionPointerOptIn, {
    enabledByDefault: false,
    smallButtonHeight: 36,
    block: 8,
    iconSide: 12,
  });
  assert.deepEqual(reference.cases.dark.geometry, geometry);
  for (const [name, nodeId] of Object.entries(reference.kitNodes))
    assert.ok(
      figma.componentSets.some(
        item => item.name === name && item.node_id === nodeId,
      ),
    );
});

test('light and dark geometry captures retain their font and image hashes', () => {
  assert.equal(
    reference.font.sha256,
    'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134',
  );
  for (const mode of ['light', 'dark']) {
    const name = `spacing-${mode}.png`;
    const image = readFileSync(
      new URL(`../sources/spacing-reference/${name}`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(image).digest('hex'),
      reference.files[name],
    );
    const png = PNG.sync.read(image);
    assert.deepEqual([png.width, png.height], [1180, 640]);
  }
});
