// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Divider baseline and source captures. @output Authority, static geometry and reference integrity regression. @position Migration-only source evidence before native Divider implementation. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateSource} from '../evidence.mjs';
import {validateFamilyUse} from '../routing.mjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url)));
const bytes = relative =>
  readFileSync(new URL(`../../../${relative}`, import.meta.url));
const sha = input => createHash('sha256').update(input).digest('hex');
const source = read('../sources/baseline/divider-compose-first.json');
const family = read('../sources/families/family-CM-0017.json');
const policy = read('../policy.json');
const compose = read('../sources/compose-inventory.json');

test('Divider source keeps Compose authority and all selected captures', () => {
  validateSource(source, policy);
  validateFamilyUse(source, [family]);
  assert.equal(source.scenarios.length, 7);
  assert.equal(source.motion.applicable, false);
  assert.equal(
    compose.tokens
      .find(t => t.name === 'DividerTokens')
      .values.find(v => v.name === 'Thickness').expression,
    '1.0.dp',
  );
  for (const scenario of source.scenarios)
    assert.equal(
      sha(bytes(scenario.baseline)),
      scenario.baselineSha256,
      scenario.id,
    );
  assert.equal(
    source.scenarios.find(s => s.id === 'divider-hairline-light')
      .baselineSha256,
    source.scenarios.find(s => s.id === 'divider-horizontal-light')
      .baselineSha256,
  );
  assert.notEqual(
    source.scenarios.find(s => s.id === 'divider-inset-start-ltr')
      .baselineSha256,
    source.scenarios.find(s => s.id === 'divider-inset-start-rtl')
      .baselineSha256,
  );
});
