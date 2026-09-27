// Copyright (c) Meta Platforms, Inc. and affiliates.
// Spring equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Kotlin focus traces, source manifest and system Chrome.
 * @output Independently evaluated browser trajectories and exact comparison errors.
 * @position Disposable source measurement before native FocusRing implementation.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const source = await read(path.join(here, 'focus-manifest.json'));
const render = await read(path.join(here, 'manifest.json'));
if (
  source.composeCommit !== policy.androidxCommit ||
  render.composeCommit !== policy.androidxCommit
)
  throw new Error('Pinned focus source revision changed');
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node capture-browser-focus.mjs [--check]');

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  if (`Chrome ${browser.version()}` !== render.browser)
    throw new Error(`Chrome source environment changed: ${browser.version()}`);
  const page = await browser.newPage();
  for (const style of ['standard', 'expressive']) {
    const item = source.traces[style];
    const sourceBytes = await fs.readFile(path.join(repo, item.file));
    if (sha256(sourceBytes) !== item.sha256)
      throw new Error(`Pinned Kotlin focus trace changed: ${style}`);
    const reference = JSON.parse(sourceBytes);
    const actual = await page.evaluate(inputs => {
      // The pinned SpringSimulation solves each segment analytically. Keep
      // this browser calculation independent of the native package solver.
      function segment(position, velocity, change, elapsedMs) {
        const frequency = Math.sqrt(change.stiffness);
        const displacement = position - change.target;
        const seconds = elapsedMs / 1000;
        let nextPosition;
        let nextVelocity;
        if (change.damping === 1) {
          const coefficient = velocity + frequency * displacement;
          const decay = Math.exp(-frequency * seconds);
          nextPosition = (displacement + coefficient * seconds) * decay;
          nextVelocity =
            (coefficient - frequency * (displacement + coefficient * seconds)) *
            decay;
        } else {
          const decayRate = -change.damping * frequency;
          const damped =
            frequency * Math.sqrt(1 - change.damping * change.damping);
          const sine = (velocity - decayRate * displacement) / damped;
          const decay = Math.exp(decayRate * seconds);
          const phase = damped * seconds;
          nextPosition =
            decay * (displacement * Math.cos(phase) + sine * Math.sin(phase));
          nextVelocity =
            decayRate * nextPosition +
            decay *
              damped *
              (sine * Math.cos(phase) - displacement * Math.sin(phase));
        }
        return {
          position: nextPosition + change.target,
          velocity: nextVelocity,
        };
      }
      const samples = [];
      let position = inputs.initialPosition;
      let velocity = inputs.initialVelocity;
      let index = 0;
      let segmentStart = 0;
      for (let timeMs = 0; timeMs <= inputs.endMs; timeMs += inputs.stepMs) {
        if (
          index + 1 < inputs.changes.length &&
          timeMs === inputs.changes[index + 1].timeMs
        ) {
          const previous = segment(
            position,
            velocity,
            inputs.changes[index],
            timeMs - segmentStart,
          );
          position = previous.position;
          velocity = previous.velocity;
          segmentStart = timeMs;
          index++;
        }
        samples.push({
          timeMs,
          ...segment(
            position,
            velocity,
            inputs.changes[index],
            timeMs - segmentStart,
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
                Math.abs(item.position) <= 0.0001 &&
                Math.abs(item.velocity) <= 0.0001,
            ),
      )?.timeMs;
      return {samples, settledAtMs};
    }, reference.inputs);
    if (
      actual.samples.length !== reference.samples.length ||
      actual.samples.some(
        (item, index) => item.timeMs !== reference.samples[index].timeMs,
      )
    )
      throw new Error(`Focus sample timeline changed: ${style}`);
    if (!Number.isFinite(actual.settledAtMs))
      throw new Error(`Browser focus interpolation did not settle: ${style}`);
    const errors = {
      position: Math.max(
        ...reference.samples.map((item, index) =>
          Math.abs(item.position - actual.samples[index].position),
        ),
      ),
      velocity: Math.max(
        ...reference.samples.map((item, index) =>
          Math.abs(item.velocity - actual.samples[index].velocity),
        ),
      ),
      settlingMs: Math.abs(reference.settledAtMs - actual.settledAtMs),
    };
    const output = {
      producer: {
        kind: 'browser',
        command:
          'node internal/material3-migration/sources/indication-reference/capture-browser-focus.mjs',
        browser: `Chrome ${browser.version()}`,
      },
      unit: reference.unit,
      inputs: reference.inputs,
      settledAtMs: actual.settledAtMs,
      samples: actual.samples,
      referenceSha256: item.sha256,
      errors,
    };
    const target = path.join(here, `browser-${style}-focus.json`);
    const bytes = `${JSON.stringify(output, null, 2)}\n`;
    if (check) {
      if ((await fs.readFile(target, 'utf8')) !== bytes)
        throw new Error(`Browser focus trace changed: ${style}`);
    } else await fs.writeFile(target, bytes);
    process.stdout.write(
      `${style}: ${actual.samples.length} samples; position ${errors.position}, velocity ${errors.velocity}, settling ${errors.settlingMs} ms\n`,
    );
  }
} finally {
  await browser.close();
}
