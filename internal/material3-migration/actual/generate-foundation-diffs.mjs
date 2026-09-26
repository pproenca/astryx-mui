// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned source baseline and independently captured native PNGs. @output Exact RGBA diff images for all 53 foundation scenarios. @position Disposable M3-NAT-002 visual evidence generator. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compare} from '../compare.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const baseline = JSON.parse(await fs.readFile(path.join(repo, 'internal/material3-migration/sources/baseline/compose-first.json')));
const actualRoot = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002');
const diffRoot = path.join(actualRoot, 'diff');
await fs.mkdir(diffRoot, {recursive: true});
let changedPixels = 0;
for (const scenario of baseline.scenarios) {
  const source = path.join(repo, scenario.baseline);
  const native = path.join(actualRoot, `${scenario.id}.png`);
  const diff = path.join(diffRoot, `${scenario.id}.png`);
  assert.equal(createHash('sha256').update(await fs.readFile(source)).digest('hex'), scenario.baselineSha256, scenario.id);
  const result = await compare(source, native, diff);
  changedPixels += result.changedPixels;
  assert.equal(result.changedPixels, 0, `${scenario.id} changed pixels`);
  assert.equal(result.maxChannelDelta, 0, `${scenario.id} channel delta`);
}
console.log(`${baseline.scenarios.length} native foundation comparisons: ${changedPixels} changed RGBA pixels.`);
