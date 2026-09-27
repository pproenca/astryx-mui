// Copyright (c) Meta Platforms, Inc. and affiliates.
// Spring equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Kotlin field traces, source manifest and system Chrome.
 * @output Independent browser spring trajectories and comparison errors.
 * @position Disposable source measurement; native component motion remains separate.
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
const referenceFile = path.join(here, 'field-motion.json');
const referenceBytes = await fs.readFile(referenceFile);
const reference = JSON.parse(referenceBytes);
const manifest = await read(path.join(here, 'manifest.json'));
if (
  reference.composeCommit !== policy.androidxCommit ||
  manifest.composeCommit !== policy.androidxCommit ||
  manifest.motionSha256 !== sha256(referenceBytes)
)
  throw new Error('Pinned field source motion changed');
if (process.argv.slice(2).some(argument => argument !== '--check'))
  throw new Error('Usage: node capture-browser-field.mjs [--check]');
const check = process.argv.includes('--check');

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  if (`Chrome ${browser.version()}` !== manifest.browser)
    throw new Error(`Chrome source environment changed: ${browser.version()}`);
  const page = await browser.newPage();
  const schemes = {};
  for (const [scheme, properties] of Object.entries(reference.schemes)) {
    schemes[scheme] = {};
    for (const [property, trace] of Object.entries(properties)) {
      const actual = await page.evaluate(
        inputs => {
          // Analytic scalar spring segment, evaluated independently of the
          // Kotlin probe and the native Material package.
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
                (coefficient -
                  frequency * (displacement + coefficient * seconds)) *
                decay;
            } else {
              const decayRate = -change.damping * frequency;
              const damped =
                frequency * Math.sqrt(1 - change.damping * change.damping);
              const sine = (velocity - decayRate * displacement) / damped;
              const decay = Math.exp(decayRate * seconds);
              const phase = damped * seconds;
              nextPosition =
                decay *
                (displacement * Math.cos(phase) + sine * Math.sin(phase));
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
          let position = inputs.initial;
          let velocity = 0;
          let changeIndex = 0;
          let segmentStart = 0;
          for (
            let timeMs = 0;
            timeMs <= inputs.endMs;
            timeMs += inputs.stepMs
          ) {
            if (
              changeIndex + 1 < inputs.changes.length &&
              timeMs === inputs.changes[changeIndex + 1].timeMs
            ) {
              const previous = segment(
                position,
                velocity,
                inputs.changes[changeIndex],
                timeMs - segmentStart,
              );
              position = previous.position;
              velocity = previous.velocity;
              changeIndex++;
              segmentStart = timeMs;
            }
            samples.push({
              timeMs,
              ...segment(
                position,
                velocity,
                inputs.changes[changeIndex],
                timeMs - segmentStart,
              ),
            });
          }
          const finalTarget = inputs.changes.at(-1).target;
          const settledAtMs = samples.find(
            (sample, index) =>
              sample.timeMs >= inputs.changes.at(-1).timeMs &&
              samples
                .slice(index)
                .every(
                  item =>
                    Math.abs(item.position - finalTarget) <= 0.0001 &&
                    Math.abs(item.velocity) <= 0.0001,
                ),
          )?.timeMs;
          return {samples, settledAtMs};
        },
        {
          initial: trace.initial,
          changes: trace.changes,
          endMs: reference.endMs,
          stepMs: reference.stepMs,
        },
      );
      if (
        actual.samples.length !== trace.samples.length ||
        actual.samples.some(
          (sample, index) => sample.timeMs !== trace.samples[index].timeMs,
        ) ||
        !Number.isFinite(actual.settledAtMs)
      )
        throw new Error(`Field sample timeline changed: ${scheme} ${property}`);
      const errors = {
        position: Math.max(
          ...trace.samples.map((sample, index) =>
            Math.abs(sample.position - actual.samples[index].position),
          ),
        ),
        velocity: Math.max(
          ...trace.samples.map((sample, index) =>
            Math.abs(sample.velocity - actual.samples[index].velocity),
          ),
        ),
        settlingMs: Math.abs(trace.settledAtMs - actual.settledAtMs),
      };
      schemes[scheme][property] = {
        unit: trace.unit,
        inputs: {
          initialPosition: trace.initial,
          initialVelocity: 0,
          changes: trace.changes,
          stepMs: reference.stepMs,
          endMs: reference.endMs,
        },
        settledAtMs: actual.settledAtMs,
        samples: actual.samples,
        errors,
      };
      console.log(
        `${scheme} ${property}: position ${errors.position}, velocity ${errors.velocity}, settling ${errors.settlingMs}ms`,
      );
    }
  }
  const output = {
    schemaVersion: 1,
    producer: {
      kind: 'browser',
      command:
        'node internal/material3-migration/sources/field-reference/capture-browser-field.mjs',
      browser: `Chrome ${browser.version()}`,
    },
    composeCommit: policy.androidxCommit,
    referenceSha256: sha256(referenceBytes),
    schemes,
  };
  const bytes = JSON.stringify(output, null, 2) + '\n';
  const file = path.join(here, 'browser-field-motion.json');
  if (check) {
    if ((await fs.readFile(file, 'utf8')) !== bytes)
      throw new Error('Browser field motion changed');
  } else await fs.writeFile(file, bytes);
} finally {
  await browser.close();
}
