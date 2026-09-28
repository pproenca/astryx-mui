// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Retained Elevation source matrices and built native public export. @output Exact native PNGs and migration-comparator diff PNGs. @position Disposable M3-GAP-006 visual evidence capture. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {pixels} from '../compare.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const source = JSON.parse(await fs.readFile(
  path.join(repo, 'internal/material3-migration/sources/baseline/elevation-compose-first.json'),
));
const actualRoot = path.join(repo, 'internal/material3-migration/actual/M3-GAP-006');
const check = process.argv.includes('--check');
execFileSync(
  'node',
  ['packages/material3/scripts/check-elevation-native-baseline.mjs', ...(check ? ['--check-capture'] : [])],
  {
    cwd: repo,
    encoding: 'utf8',
    env: {...process.env, M3_CAPTURE_DIR: actualRoot},
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
for (const scenario of source.scenarios) {
  const reference = PNG.sync.read(await fs.readFile(path.join(repo, scenario.baseline)));
  const actual = PNG.sync.read(await fs.readFile(path.join(actualRoot, `${scenario.id}.png`)));
  const diff = pixels(reference, actual);
  assert.equal(diff.changedPixels, 0, `${scenario.id} changed pixels`);
  const image = PNG.sync.write(diff);
  const diffPath = path.join(actualRoot, 'diff', `${scenario.id}.png`);
  if (check)
    assert.ok((await fs.readFile(diffPath)).equals(image), `${scenario.id} diff changed`);
  else {
    await fs.mkdir(path.dirname(diffPath), {recursive: true});
    await fs.writeFile(diffPath, image);
  }
  console.log(`${scenario.id}: zero changed pixels`);
}
