// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose elevation tokens and Figma/Web shadow inventories. @output Level and browser-shadow gap decisions. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const kit = read('../sources/figma-foundation-values.json');
const figma = read('../sources/figma-kit-inventory.json');
const web = read(
  '../../../packages/themes/material3/src/material3ElevationSource.json',
);
const policy = read('../policy.json');

test('Compose owns six dp levels; kit/Web shadows only fill a browser rendering gap', () => {
  assert.equal(compose.commit, policy.androidxCommit);
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  assert.equal(kit.sourceExportSha256, policy.figmaSha256);
  assert.equal(web.sourceCommit, policy.materialWebCommit);
  const levels = Object.fromEntries(
    compose.tokens
      .find(file => file.name === 'ElevationTokens')
      .values.map(({name, expression}) => [
        name.toLowerCase(),
        Number(expression.replace(/\.dp$/, '')),
      ]),
  );
  assert.deepEqual(levels, web.generatedDp);
  assert.deepEqual(Object.values(levels), [0, 1, 3, 6, 8, 12]);

  assert.equal(kit.elevationStyles.length, 10);
  const parseWeb = ({boxShadow, opacity}) => {
    const match = boxShadow.match(
      /^rgb\(1, 2, 3\) (-?\d+)px (-?\d+)px (\d+)px (-?\d+)px$/,
    );
    assert.ok(match, `Unrecognized pinned Web shadow: ${boxShadow}`);
    return [...match.slice(1).map(Number), opacity];
  };
  const parseKit = shadow => {
    assert.equal(shadow.type, 'DROP_SHADOW');
    assert.deepEqual(
      [shadow.color.r, shadow.color.g, shadow.color.b],
      [0, 0, 0],
    );
    return [
      shadow.x,
      shadow.y,
      shadow.radius,
      shadow.spread,
      Number(shadow.color.a.toFixed(2)),
    ];
  };
  const sorted = layers => layers.map(layer => layer.join(',')).sort();
  for (const mode of ['Light', 'Dark']) {
    for (let level = 1; level <= 5; level++) {
      const style = kit.elevationStyles.find(
        item => item.name === `M3/Elevation ${mode}/${level}`,
      );
      assert.ok(style, `Missing kit ${mode} elevation ${level}`);
      assert.equal(style.shadows.length, 2);
      const webLayers = Object.values(web.layers[`level${level}`]).map(
        parseWeb,
      );
      assert.deepEqual(sorted(style.shadows.map(parseKit)), sorted(webLayers));
    }
  }
});
