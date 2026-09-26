// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose Icon source, Google artwork/font pins and light/dark captures. @output Regression evidence for icon fallback and source samples. @position Migration-only icon source decision test. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-kit-inventory.json');
const artwork = read(
  '../../../packages/themes/material3/src/material3IconSource.json',
);
const reference = read('../sources/icon-reference/manifest.json');
const policy = read('../policy.json');

test('Compose icon fallback and Google source pins are explicit', () => {
  assert.equal(reference.composeCommit, policy.androidxCommit);
  assert.equal(reference.figmaSha256, policy.figmaSha256);
  assert.deepEqual(reference.composeIcon, {
    path: compose.families.find(item => item.name === 'Icon').path,
    sha256: compose.families.find(item => item.name === 'Icon').sha256,
  });
  assert.equal(reference.composeFallbackSize, 24);
  assert.equal(
    compose.tokens
      .find(item => item.name === 'SmallIconButtonTokens')
      .values.find(item => item.name === 'IconSize').expression,
    '24.0.dp',
  );
  assert.equal(reference.googleIconCommit, artwork.sourceCommit);
  assert.equal(
    reference.kitIconSetCount,
    figma.componentSets.filter(item => /icon/i.test(item.name)).length,
  );
  assert.deepEqual(Object.keys(reference.fontPins), [
    'Outlined',
    'Rounded',
    'Sharp',
  ]);
  for (const [name, pin] of Object.entries(reference.artwork))
    assert.deepEqual(pin, {
      sourcePath: artwork.artwork[name].sourcePath,
      sha256: artwork.artwork[name].sha256,
    });
});

test('light/dark icon samples retain the selected glyphs, axes and image hashes', () => {
  for (const mode of ['light', 'dark']) {
    const sample = reference.cases[mode];
    assert.deepEqual(sample.glyphs, ['close', 'check', 'search']);
    assert.deepEqual(sample.axes, {
      fill: 0,
      weight: 400,
      grade: 0,
      opticalSize: 24,
    });
    const name = `icons-${mode}.png`;
    const image = readFileSync(
      new URL(`../sources/icon-reference/${name}`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(image).digest('hex'),
      reference.files[name],
    );
    const png = PNG.sync.read(image);
    assert.deepEqual([png.width, png.height], [1180, 640]);
  }
});
