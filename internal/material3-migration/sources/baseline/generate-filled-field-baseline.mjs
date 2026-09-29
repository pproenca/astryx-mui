// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Approved shared field decision and its pinned composite source frames.
 * @output Filled-only source crops and a task-specific projection of the shared decision.
 * @position Disposable M3-GAP-009 verification baseline; source authority remains family-CM-0021.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharedPath = 'internal/material3-migration/sources/baseline/field-compose-first.json';
const outputPath = 'internal/material3-migration/sources/baseline/filled-field-compose-first.json';
const cropRoot = 'internal/material3-migration/sources/field-reference/filled/';
const read = async file => fs.readFile(path.join(repo, file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const check = process.argv.includes('--check');
const source = JSON.parse(await read(sharedPath));
if (source.authority !== 'compose-first' || source.scenarios.length !== 22)
  throw new Error('The shared field decision changed; review the crop geometry');

// The source renderer's main padding is 36px; its two filled cards start at
// 131px and 269px. Retain their original RGBA pixels without scaling, masking,
// or rerendering. The adjacent outlined cards belong to M3-GAP-010.
const crops = [
  {variant: 'standard', x: 36, y: 131},
  {variant: 'expressive', x: 36, y: 269},
];
const scenarios = [];
for (const frame of source.scenarios) {
  const image = await read(frame.baseline);
  if (hash(image) !== frame.baselineSha256)
    throw new Error(`Shared source frame changed: ${frame.id}`);
  const png = PNG.sync.read(image);
  if (png.width !== 960 || png.height !== 420)
    throw new Error(`Shared source dimensions changed: ${frame.id}`);
  for (const crop of crops) {
    const tile = new PNG({width: 280, height: 56});
    PNG.bitblt(png, tile, crop.x, crop.y, 280, 56, 0, 0);
    const bytes = PNG.sync.write(tile);
    const file = `${cropRoot}${crop.variant}-${frame.id}.png`;
    if (check) {
      if (hash(await read(file)) !== hash(bytes))
        throw new Error(`Filled source crop changed: ${file}`);
    } else {
      await fs.mkdir(path.dirname(path.join(repo, file)), {recursive: true});
      await fs.writeFile(path.join(repo, file), bytes);
    }
    scenarios.push({
      ...frame,
      id: `filled-${crop.variant}-${frame.id}`,
      sourceReference: `${frame.sourceReference}; exact ${crop.variant} filled card crop from ${frame.id}`,
      baseline: file,
      baselineSha256: hash(bytes),
      environment: {
        ...frame.environment,
        content: `${crop.variant} 280 x 56 filled field with empty label and placeholder`,
        crop: {x: crop.x, y: crop.y, width: 280, height: 56},
      },
    });
  }
}
const baseline = {
  ...source,
  parentDecision: sharedPath,
  status: 'FilledField visual crop of the approved shared family source; native pixel and interactive acceptance pending.',
  compose: {
    ...source.compose,
    tests: source.compose.tests.filter(test => test.id.startsWith('TextFieldTest.')),
  },
  scenarios,
};
const bytes = Buffer.from(`${JSON.stringify(baseline, null, 2)}\n`);
if (check) {
  if (hash(await read(outputPath)) !== hash(bytes))
    throw new Error('FilledField source baseline changed');
} else await fs.writeFile(path.join(repo, outputPath), bytes);
console.log(`FilledField baseline: ${scenarios.length} exact source crops`);
