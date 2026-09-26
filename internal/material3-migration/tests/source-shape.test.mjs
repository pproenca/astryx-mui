// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose, Figma and Material Web shape inventories. @output Nine matching corners and the Full geometry disagreement. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-kit-inventory.json');
const web = read('../../../packages/themes/material3/src/material3ShapeSource.json');
const policy = read('../policy.json');
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
        : Number(expression.match(/^RoundedCornerShape\((\d+(?:\.\d+)?)\.dp\)$/)?.[1]);
    assert.ok(Number.isFinite(selected), `Unresolved Compose corner: ${role}`);
    assert.equal(selected, Number(item.baseline), role);
  }
});
