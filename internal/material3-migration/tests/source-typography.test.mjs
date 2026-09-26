// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose type tokens and the supplied kit's extracted text styles. @output Exact numeric typography disagreements across 30 roles. @position Migration-only source decision regression. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const compose = read('../sources/compose-inventory.json');
const figma = read('../sources/figma-foundation-values.json');
const policy = read('../policy.json');
const tokens = new Map(
  compose.tokens
    .find(file => file.name === 'TypeScaleTokens')
    .values.map(({name, expression}) => [name, expression]),
);
const typeface = new Map(
  compose.tokens
    .find(file => file.name === 'TypefaceTokens')
    .values.map(({name, expression}) => [name, expression]),
);
const composeWeights = {Normal: 400, Medium: 500, Bold: 700};
const figmaWeights = {Regular: 400, Medium: 500, SemiBold: 600, Bold: 700};
const title = value => value[0].toUpperCase() + value.slice(1);

function roleName(style) {
  const [family, variant] = style.name.slice('M3/'.length).split('/');
  return title(family) + variant.split('-').map(title).join('');
}

function composeValue(role, metric) {
  const expression = tokens.get(role + metric);
  assert.ok(expression, `Missing Compose type token: ${role}${metric}`);
  if (metric !== 'Weight') {
    assert.match(expression, /^-?\d+(?:\.\d+)?\.sp$/);
    return Number(expression.slice(0, -3));
  }
  const weight = typeface.get(expression.slice('TypefaceTokens.'.length));
  assert.ok(weight, `Missing Compose typeface token: ${expression}`);
  return composeWeights[weight.slice('FontWeight.'.length)];
}

test('Compose type metrics retain ten explicit kit disagreements', () => {
  assert.equal(compose.commit, policy.androidxCommit);
  assert.equal(figma.sourceExportSha256, policy.figmaSha256);
  assert.equal(figma.typographyStyles.length, 30);

  const differences = [];
  for (const style of figma.typographyStyles) {
    const role = roleName(style);
    const kit = {
      Size: style.sizePx,
      LineHeight: style.lineHeight.value,
      Tracking: style.tracking.value,
      Weight: figmaWeights[style.font.style],
    };
    for (const [metric, kitValue] of Object.entries(kit)) {
      assert.ok(Number.isFinite(kitValue), `Missing kit ${role}${metric}`);
      const selected = composeValue(role, metric);
      if (Math.abs(selected - kitValue) > 0.00001)
        differences.push([
          role,
          metric,
          selected,
          Number(kitValue.toFixed(4)),
        ]);
    }
  }
  assert.deepEqual(differences, [
    ['BodyLargeEmphasized', 'Tracking', 0.15, 0.5],
    ['BodyMedium', 'Tracking', 0.2, 0.25],
    ['DisplayLarge', 'Tracking', -0.2, -0.25],
    ['DisplayLargeEmphasized', 'Tracking', 0, -0.25],
    ['LabelLargeEmphasized', 'Weight', 700, 600],
    ['LabelMediumEmphasized', 'Weight', 700, 600],
    ['LabelSmallEmphasized', 'Weight', 700, 600],
    ['TitleMedium', 'Tracking', 0.2, 0.15],
    ['TitleMediumEmphasized', 'Weight', 700, 600],
    ['TitleSmallEmphasized', 'Weight', 700, 600],
  ]);
});
