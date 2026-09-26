// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Independent Kotlin spring trajectories and source replay captures. @output Regression evidence for pinned motion inputs and light/dark timed frames. @position Migration-only motion source test. */
import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';

const read = relative =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const manifest = read('../sources/motion/source-reference/manifest.json');
const upstream = read('../sources/motion/upstream/manifest.json');
const policy = read('../policy.json');

test('motion source replay binds both default spatial springs to independent Kotlin traces', () => {
  assert.equal(manifest.composeCommit, policy.androidxCommit);
  assert.equal(manifest.upstreamSource, upstream.source);
  assert.equal(manifest.upstreamSourceSha256, upstream.sourceSha256);
  assert.deepEqual(manifest.times, [0, 120, 260, 600, 900, 1380]);
  assert.equal(manifest.inputs.stepMs, 20);
  assert.deepEqual(
    manifest.inputs.changes.map(item => item.timeMs),
    [0, 120, 260, 600],
  );
  assert.deepEqual(manifest.settledAtMs, {
    'standard-default-spatial': 1120,
    'expressive-default-spatial': 1380,
  });
  for (const [name, hash] of Object.entries(manifest.traceHashes)) {
    assert.equal(hash, upstream.files[name].sha256);
    const trace = read(
      `../sources/motion/upstream/${upstream.files[name].file}`,
    );
    assert.equal(trace.producer.kind, 'upstream');
    assert.equal(trace.producer.commit, policy.androidxCommit);
    assert.equal(trace.settledAtMs, manifest.settledAtMs[name]);
  }
});

test('source clip and light/dark frame sheets retain their capture hashes', () => {
  assert.equal(manifest.fps, 50);
  assert.equal(
    manifest.font.sha256,
    'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134',
  );
  for (const [name, expected] of Object.entries(manifest.files)) {
    const bytes = readFileSync(
      new URL(`../sources/motion/source-reference/${name}`, import.meta.url),
    );
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected);
    if (name.endsWith('.png')) {
      const png = PNG.sync.read(bytes);
      assert.deepEqual([png.width, png.height], [1180, 520]);
    } else {
      assert.equal(bytes.subarray(4, 8).toString('ascii'), 'ftyp');
    }
  }
});
