// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned source and independent native 1180x520 motion sheets. @output Matched 0/260/1380 ms light/dark panel crops and source hashes. @position Disposable foundation motion frame evidence. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const source = path.join(repo, 'internal/material3-migration/sources/motion/source-reference');
const actual = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002');
const frames = [{timeMs: 0, x: 31, y: 96}, {timeMs: 260, x: 786, y: 96}, {timeMs: 1380, x: 786, y: 280}];
const crop = (image, {x, y}) => {
  assert.equal(image.width, 1180);
  assert.equal(image.height, 520);
  const output = new PNG({width: 363, height: 170});
  for (let row = 0; row < output.height; row++) {
    const from = ((y + row) * image.width + x) * 4;
    image.data.copy(output.data, row * output.width * 4, from, from + output.width * 4);
  }
  return PNG.sync.write(output);
};
const hashes = {};
await fs.mkdir(path.join(source, 'frames'), {recursive: true});
for (const mode of ['light', 'dark']) {
  const sourceSheet = PNG.sync.read(await fs.readFile(path.join(source, `motion-${mode}.png`)));
  const actualSheet = PNG.sync.read(await fs.readFile(path.join(actual, `motion-${mode}.png`)));
  for (const frame of frames) {
    const name = `motion-${mode}-${frame.timeMs}.png`;
    const referenceBytes = crop(sourceSheet, frame);
    const actualBytes = crop(actualSheet, frame);
    await fs.writeFile(path.join(source, 'frames', name), referenceBytes);
    await fs.writeFile(path.join(actual, name), actualBytes);
    hashes[name] = createHash('sha256').update(referenceBytes).digest('hex');
  }
}
console.log(JSON.stringify(hashes, null, 2));
