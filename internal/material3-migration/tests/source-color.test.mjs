// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose, Figma and Material Web source inventories. @output The exact light/dark role disagreements and Shadow gap. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-kit-inventory.json');
const web = read('../../../packages/themes/material3/src/material3ColorSource.json');
const policy = read('../policy.json');

const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  assert.ok(file, `Missing pinned Compose token file: ${name}`);
  return file.values;
};
const roleName = name =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const hex = value => {
  const digits = value.toLowerCase().replace(/^#/, '');
  return `#${digits.length === 3 ? [...digits].map(d => d + d).join('') : digits}`;
};
const palette = new Map(
  token('PaletteTokens').map(({name, expression}) => {
    const match = expression.match(
      /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
    );
    assert.ok(match, `Unresolved Compose palette expression: ${name}`);
    return [
      name,
      `#${match.slice(1).map(n => Number(n).toString(16).padStart(2, '0')).join('')}`,
    ];
  }),
);
const kit = new Map(
  figma.variables
    .filter(item => item.collection === 'M3' && item.name.startsWith('Schemes/'))
    .map(item => [
      item.name.slice('Schemes/'.length).toLowerCase().replace(/\s+/g, '-'),
      item,
    ]),
);

function composeScheme(mode) {
  const expressions = new Map(
    token(`Color${mode}Tokens`).map(({name, expression}) => [name, expression]),
  );
  function resolve(name) {
    const expression = expressions.get(name);
    assert.ok(expression, `Unresolved Compose scheme role: ${name}`);
    return expression.startsWith('PaletteTokens.')
      ? palette.get(expression.slice('PaletteTokens.'.length))
      : resolve(expression);
  }
  return new Map([...expressions.keys()].map(name => [roleName(name), resolve(name)]));
}

test('Compose wins four light scheme disagreements; Shadow is an evidenced gap', () => {
  assert.equal(compose.commit, policy.androidxCommit);
  assert.equal(figma.source.localExportSha256, policy.figmaSha256);
  assert.equal(web.sourceCommit, policy.materialWebCommit);
  assert.equal(kit.size, 49);

  for (const mode of ['Light', 'Dark']) {
    const scheme = composeScheme(mode);
    assert.equal(scheme.size, 48);
    assert.deepEqual([...kit.keys()].filter(name => !scheme.has(name)), ['shadow']);
    const differences = [...scheme].flatMap(([name, value]) => {
      const selected = hex(value);
      const kitValue = hex(kit.get(name)[mode.toLowerCase()]);
      return selected === kitValue ? [] : [[name, selected, kitValue]];
    });
    assert.deepEqual(
      differences,
      mode === 'Light'
        ? [
            ['on-error-container', '#410e0b', '#852221'],
            ['on-primary-container', '#21005d', '#4f378a'],
            ['on-secondary-container', '#1d192b', '#4a4459'],
            ['on-tertiary-container', '#31111d', '#633b48'],
          ]
        : [],
    );
    assert.equal(hex(kit.get('shadow')[mode.toLowerCase()]), '#000000');
    assert.equal(hex(web[`${mode.toLowerCase()}Resolved`].shadow), '#000000');
  }
});
