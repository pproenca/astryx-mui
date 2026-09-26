// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose, Figma and Material Web shape inventories plus 35 compiled source shapes. @output Corner values, shape-set mapping and measured ClamShell/Hexagon overlap. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-kit-inventory.json');
const web = read(
  '../../../packages/themes/material3/src/material3ShapeSource.json',
);
const policy = read('../policy.json');
const shapeManifest = read('../sources/shape-reference/manifest.json');
const shape = new Map(
  compose.tokens
    .find(file => file.name === 'ShapeTokens')
    .values.map(({name, expression}) => [name, expression]),
);
const kit = figma.variables.filter(item => item.collection === 'Shape');
const title = value => value[0].toUpperCase() + value.slice(1);
const roleName = item =>
  'Corner' + item.name.slice('Corner/'.length).split('-').map(title).join('');

test('Compose corners agree numerically with the kit except Full geometry', () => {
  assert.equal(compose.commit, policy.androidxCommit);
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  assert.equal(web.sourceCommit, policy.materialWebCommit);
  assert.equal(kit.length, 10);

  for (const item of kit) {
    const role = roleName(item);
    const expression = shape.get(role);
    assert.ok(expression, `Missing Compose corner: ${role}`);
    if (role === 'CornerFull') {
      assert.equal(expression, 'CircleShape');
      assert.equal(Number(item.baseline), 1000);
      assert.equal(web.cssCorners['corner-full'], '9999px');
      continue;
    }
    const selected =
      expression === 'RectangleShape'
        ? 0
        : Number(
            expression.match(
              /^RoundedCornerShape\((\d+(?:\.\d+)?)\.dp\)$/,
            )?.[1],
          );
    assert.ok(Number.isFinite(selected), `Unresolved Compose corner: ${role}`);
    assert.equal(selected, Number(item.baseline), role);
  }
});

test('compiled Compose ClamShell closely corresponds to kit Hexagon without exact pixel identity', () => {
  const file = relative => readFileSync(new URL(relative, import.meta.url));
  const sha256 = data => createHash('sha256').update(data).digest('hex');
  const source = file('../sources/shape-reference/compose-clam-shell.png');
  const kit = file('../sources/figma-exports/shape-hexagon.png');
  assert.equal(
    sha256(file('../sources/shape-reference/compose-clam-shell.svg')),
    '2d9cb6b870de366234f7f52f7499e50ae14f62797e203120193256817d322b72',
  );
  assert.equal(
    sha256(source),
    '06bbe34d310d57d5809273270cb0ce9d34bb13251e9ffb0a4395d29862eeb35a',
  );
  assert.equal(
    sha256(kit),
    'f90fcee6bf1c275ea913985d352d7c106d0590297ce55157691cdfbec20af852',
  );
  const [a, b] = [source, kit].map(data => PNG.sync.read(data));
  assert.deepEqual(
    [a.width, a.height, b.width, b.height],
    [380, 380, 380, 380],
  );
  let intersection = 0;
  let union = 0;
  let changedAlpha = 0;
  for (let pixel = 0; pixel < 380 * 380; pixel++) {
    const sourceAlpha = a.data[pixel * 4 + 3];
    const kitAlpha = b.data[pixel * 4 + 3];
    if (sourceAlpha > 127 && kitAlpha > 127) intersection++;
    if (sourceAlpha > 127 || kitAlpha > 127) union++;
    if (sourceAlpha !== kitAlpha) changedAlpha++;
  }
  assert.ok(intersection / union > 0.98);
  assert.equal(changedAlpha, 2282);
});

test('compiled Compose source fixture covers all 35 frozen kit shape variants', () => {
  assert.equal(shapeManifest.composeCommit, policy.androidxCommit);
  assert.equal(shapeManifest.figmaSha256, policy.figmaSha256);
  assert.equal(
    shapeManifest.materialShapesSha256,
    compose.families.find(item => item.name === 'MaterialShapes')?.sha256,
  );
  const kitSet = figma.componentSets.find(item => item.name === 'Shape Set');
  assert.equal(shapeManifest.kitShapeSetNodeId, kitSet.node_id);
  assert.equal(shapeManifest.mappings.length, 35);
  assert.deepEqual(
    new Set(shapeManifest.mappings.map(item => item.kitVariant)),
    new Set(kitSet.values.slice('Shape: '.length).split(', ')),
  );
  assert.deepEqual(
    shapeManifest.mappings.find(item => item.compose === 'ClamShell'),
    {compose: 'ClamShell', kitVariant: 'Hexagon'},
  );
  const file = relative => readFileSync(new URL(relative, import.meta.url));
  const sha256 = data => createHash('sha256').update(data).digest('hex');
  for (const [name, expected] of Object.entries(shapeManifest.files))
    assert.equal(
      sha256(file(`../sources/shape-reference/${name}`)),
      expected,
      name,
    );
  const svg = file('../sources/shape-reference/compose-expressive-shapes.svg');
  assert.equal((svg.toString().match(/<path /g) || []).length, 35);
  const png = PNG.sync.read(
    file('../sources/shape-reference/compose-expressive-shapes.png'),
  );
  assert.deepEqual([png.width, png.height], [1540, 1100]);
});
