// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose elevation/color tokens, Figma/Web shadow inventories and light/dark reference captures. @output Level, tonal and browser-shadow source decisions. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const kit = read('../sources/figma-foundation-values.json');
const figma = read('../sources/figma-kit-inventory.json');
const web = read(
  '../../../packages/themes/material3/src/material3ElevationSource.json',
);
const policy = read('../policy.json');
const reference = read('../sources/elevation-reference/manifest.json');

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

test('light/dark elevation captures preserve the Compose tonal formula and licensed font', () => {
  assert.equal(reference.composeCommit, policy.androidxCommit);
  assert.equal(reference.figmaSha256, policy.figmaSha256);
  assert.equal(reference.webCommit, policy.materialWebCommit);
  assert.equal(
    reference.colorSchemeSha256,
    compose.families.find(item => item.name === 'ColorScheme')?.sha256,
  );
  assert.deepEqual(
    reference.levels.map(item => item.dp),
    [0, 1, 3, 6, 8, 12],
  );
  for (const item of reference.levels)
    assert.equal(
      item.alpha,
      item.dp === 0 ? 0 : (4.5 * Math.log(item.dp + 1) + 2) / 100,
    );
  assert.equal(
    reference.font.sha256,
    'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134',
  );
  assert.deepEqual(Object.keys(reference.files), [
    'elevation-light.png',
    'elevation-dark.png',
  ]);
  for (const [name, expected] of Object.entries(reference.files)) {
    const bytes = readFileSync(
      new URL(`../sources/elevation-reference/${name}`, import.meta.url),
    );
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected);
    const png = PNG.sync.read(bytes);
    assert.deepEqual([png.width, png.height], [1280, 760]);
  }
  assert.equal(reference.cases.light.surface, '#fef7ff');
  assert.equal(reference.cases.dark.surface, '#141218');
  assert.equal(reference.cases.light.nested.absoluteDp, 4);
  assert.equal(reference.cases.dark.nested.absoluteDp, 4);
});
