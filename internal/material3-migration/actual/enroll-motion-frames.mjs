// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Cropped pinned source motion panels and approved Compose-first baseline. @output Explicit start/intermediate/settled visual scenarios. @position Disposable M3-NAT-002 source baseline maintenance. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const relative = 'internal/material3-migration/sources/baseline/compose-first.json';
const file = path.join(repo, relative);
const baseline = JSON.parse(await fs.readFile(file));
for (const mode of ['light', 'dark']) {
  const sheet = baseline.scenarios.find(item => item.id === `motion-${mode}`);
  for (const [timeMs, x, y] of [[0, 31, 96], [260, 786, 96], [1380, 786, 280]]) {
    const id = `motion-${mode}-${timeMs}`;
    if (baseline.scenarios.some(item => item.id === id)) continue;
    const source = `internal/material3-migration/sources/motion/source-reference/frames/${id}.png`;
    const baselineSha256 = createHash('sha256').update(await fs.readFile(path.join(repo, source))).digest('hex');
    baseline.scenarios.push({
      id,
      dimensions: ['motion'],
      sourceReference: 'Pinned Kotlin SpringSimulation start, intermediate and settled panel from the source contact sheet',
      baseline: source,
      baselineSha256,
      timeMs,
      environment: {
        ...sheet.environment,
        content: `Standard and Expressive default spatial positions at ${timeMs} ms`,
        state: 'retargeted-reversed-upstream-trace-panel',
        captureRegion: {x, y, width: 363, height: 170},
      },
    });
  }
}
await fs.writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(`${baseline.scenarios.length} foundation visual scenarios with timed motion panels.`);
