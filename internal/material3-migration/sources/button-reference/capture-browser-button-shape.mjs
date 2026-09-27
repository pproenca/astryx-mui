// Copyright (c) Meta Platforms, Inc. and affiliates.
// Spring equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Kotlin Button shape trace and system Chrome.
 * @output Independent browser interpolation and exact source comparison errors.
 * @position Disposable source measurement before native Button implementation.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = await fs.readFile(
  path.join(here, 'button-shape-motion.json'),
);
const source = JSON.parse(sourceBytes);
const manifest = await read(path.join(here, 'manifest.json'));
if (sha256(sourceBytes) !== manifest.traceSha256)
  throw new Error('Pinned Kotlin Button shape trace changed');
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node capture-browser-button-shape.mjs [--check]');
const check = process.argv.includes('--check');

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  const actual = await page.evaluate(inputs => {
    // For two shape endpoints, AnimatedShapeState's progress/velocity flip
    // equals retargeting the visible pressed fraction with velocity intact.
    // Evaluate the spring here without importing the native package solver.
    function segment(position, velocity, target, elapsedMs, stiffness) {
      const frequency = Math.sqrt(stiffness);
      const displacement = position - target;
      const seconds = elapsedMs / 1000;
      const coefficient = velocity + frequency * displacement;
      const decay = Math.exp(-frequency * seconds);
      return {
        pressedFraction:
          (displacement + coefficient * seconds) * decay + target,
        velocity:
          (coefficient - frequency * (displacement + coefficient * seconds)) *
          decay,
      };
    }
    const samples = [];
    let position = 0;
    let velocity = 0;
    let index = 0;
    let segmentStart = 0;
    const target = change => (change.pressed ? 1 : 0);
    for (let timeMs = 0; timeMs <= inputs.endMs; timeMs += inputs.stepMs) {
      if (
        index + 1 < inputs.changes.length &&
        timeMs === inputs.changes[index + 1].timeMs
      ) {
        const previous = segment(
          position,
          velocity,
          target(inputs.changes[index]),
          timeMs - segmentStart,
          inputs.stiffness,
        );
        position = previous.pressedFraction;
        velocity = previous.velocity;
        segmentStart = timeMs;
        index++;
      }
      samples.push({
        timeMs,
        ...segment(
          position,
          velocity,
          target(inputs.changes[index]),
          timeMs - segmentStart,
          inputs.stiffness,
        ),
      });
    }
    const settledAtMs = samples.find(
      (sample, index) =>
        sample.timeMs >= inputs.changes.at(-1).timeMs &&
        samples
          .slice(index)
          .every(
            item =>
              Math.abs(item.pressedFraction) <= 0.0001 &&
              Math.abs(item.velocity) <= 0.0001,
          ),
    )?.timeMs;
    return {samples, settledAtMs};
  }, source.inputs);
  if (
    actual.samples.length !== source.samples.length ||
    actual.samples.some(
      (sample, index) => sample.timeMs !== source.samples[index].timeMs,
    ) ||
    !Number.isFinite(actual.settledAtMs)
  )
    throw new Error('Browser Button shape timeline changed');
  const errors = {
    position: Math.max(
      ...source.samples.map((sample, index) =>
        Math.abs(
          sample.pressedFraction - actual.samples[index].pressedFraction,
        ),
      ),
    ),
    velocity: Math.max(
      ...source.samples.map((sample, index) =>
        Math.abs(sample.velocity - actual.samples[index].velocity),
      ),
    ),
    settlingMs: Math.abs(source.settledAtMs - actual.settledAtMs),
  };
  const output = {
    producer: {
      kind: 'browser',
      command:
        'node internal/material3-migration/sources/button-reference/capture-browser-button-shape.mjs',
      browser: `Chrome ${browser.version()}`,
    },
    unit: source.unit,
    inputs: source.inputs,
    settledAtMs: actual.settledAtMs,
    samples: actual.samples,
    referenceSha256: sha256(sourceBytes),
    errors,
  };
  const bytes = `${JSON.stringify(output, null, 2)}\n`;
  const target = path.join(here, 'browser-button-shape-motion.json');
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Browser Button shape trace changed');
  } else await fs.writeFile(target, bytes);
  console.log(
    JSON.stringify({
      samples: actual.samples.length,
      settledAtMs: actual.settledAtMs,
      errors,
      browser: browser.version(),
    }),
  );
} finally {
  await browser.close();
}
