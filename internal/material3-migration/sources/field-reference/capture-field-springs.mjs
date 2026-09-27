// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned TextFieldImpl, MotionScheme, spring implementation and local Kotlin compiler cache.
 * @output Standard and Expressive field label, placeholder, color and indicator traces.
 * @position Disposable source motion probe; native browser traces are captured separately.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const sources = path.resolve(here, '..');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const inventory = await read(path.join(sources, 'compose-inventory.json'));
const androidx = process.env.M3_ANDROIDX;
if (!androidx || inventory.commit !== policy.androidxCommit)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error('Pinned AndroidX checkout differs from the clean source pin');

const upstream = path.join(sources, 'motion/upstream');
const springSource =
  'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringSimulation.kt';
const fieldSource =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/TextFieldImpl.kt';
const motionSource =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt';
const sourceSha256 = Object.fromEntries(
  await Promise.all(
    [springSource, fieldSource, motionSource].map(async file => [
      file,
      sha256(await fs.readFile(path.join(androidx, file))),
    ]),
  ),
);
const fieldText = await fs.readFile(path.join(androidx, fieldSource), 'utf8');
for (const expression of [
  'MotionSchemeKeyTokens.FastSpatial.value<Float>()',
  'MotionSchemeKeyTokens.FastEffects.value<Float>()',
  'MotionSchemeKeyTokens.SlowEffects.value<Float>()',
  'MotionSchemeKeyTokens.FastSpatial.value<Dp>()',
]) {
  if (!fieldText.includes(expression))
    throw new Error(`Pinned field motion changed: ${expression}`);
}
const cache =
  process.env.M3_GRADLE_CACHE ||
  path.join(os.homedir(), '.gradle/caches/modules-2/files-2.1');
async function jar(group, name, version) {
  const directory = path.join(cache, group, name, version);
  for (const entry of await fs.readdir(directory)) {
    const file = path.join(directory, entry, `${name}-${version}.jar`);
    try {
      await fs.access(file);
      return file;
    } catch {}
  }
  throw new Error(`Missing Kotlin dependency: ${group}/${name}/${version}`);
}
const modules = [
  ['org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-build-tools-api', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-stdlib', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-script-runtime', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-reflect', '1.6.10'],
  ['org.jetbrains.kotlin', 'kotlin-daemon-embeddable', '2.4.20'],
  ['org.jetbrains.kotlinx', 'kotlinx-coroutines-core-jvm', '1.8.0'],
  ['org.jetbrains', 'annotations', '23.0.0'],
];
const jars = await Promise.all(modules.map(item => jar(...item)));
const stdlib = jars[2];
const javaVersion = spawnSync('java', ['-version'], {encoding: 'utf8'});
if (javaVersion.status !== 0) throw new Error('Java runtime unavailable');
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-field-probe-'),
);
const output = path.join(temporary, 'classes');
await fs.mkdir(output);
const check = process.argv.includes('--check');
const token = (scheme, name) => {
  const item = inventory.tokens.find(
    candidate => candidate.name === `${scheme}MotionTokens`,
  );
  const expression = item?.values.find(
    value => value.name === name,
  )?.expression;
  if (!/^\d+(?:\.\d+)?f$/.test(expression || ''))
    throw new Error(`Unresolved ${scheme} ${name}`);
  return Number(expression.slice(0, -1));
};
const spec = (scheme, kind) => ({
  damping: token(scheme, `Spring${kind}Damping`),
  stiffness: token(scheme, `Spring${kind}Stiffness`),
});
const timeline = [0, 120, 160, 600];
const targets = {
  label: [1, 0, 1, 0],
  placeholder: [1, 0, 1, 0],
  indicator: [2, 1, 2, 1],
  color: [1, 0, 1, 0],
};
const specKinds = {
  label: ['FastSpatial', 'FastSpatial', 'FastSpatial', 'FastSpatial'],
  placeholder: ['SlowEffects', 'FastEffects', 'SlowEffects', 'FastEffects'],
  indicator: ['FastSpatial', 'FastSpatial', 'FastSpatial', 'FastSpatial'],
  color: ['FastEffects', 'FastEffects', 'FastEffects', 'FastEffects'],
};
const initial = {label: 0, placeholder: 0, indicator: 1, color: 0};
try {
  execFileSync(
    'java',
    [
      '--enable-native-access=ALL-UNNAMED',
      '-cp',
      jars.join(path.delimiter),
      'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
      '-no-stdlib',
      '-no-reflect',
      '-classpath',
      [stdlib, jars[7]].join(path.delimiter),
      '-d',
      output,
      path.join(androidx, springSource),
      path.join(upstream, 'SpringProbeSupport.kt'),
      path.join(upstream, 'FloatPacking.kt'),
      path.join(here, 'FieldSpringProbe.kt'),
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000},
  );
  const schemes = {};
  for (const scheme of ['Standard', 'Expressive']) {
    const traces = {};
    for (const property of Object.keys(targets)) {
      const changes = timeline.map((timeMs, index) => ({
        timeMs,
        target: targets[property][index],
        ...spec(scheme, specKinds[property][index]),
      }));
      const argument = changes
        .map(({timeMs, target, damping, stiffness}) =>
          [timeMs, target, damping, stiffness].join(':'),
        )
        .join(',');
      const stdout = execFileSync(
        'java',
        [
          '-cp',
          [output, stdlib].join(path.delimiter),
          'androidx.compose.animation.core.FieldSpringProbeKt',
          argument,
          '1600',
          '20',
          String(initial[property]),
        ],
        {encoding: 'utf8', maxBuffer: 5_000_000},
      );
      const samples = stdout
        .trim()
        .split('\n')
        .map(line => {
          const [timeMs, position, velocity] = line.split('\t').map(Number);
          if (![timeMs, position, velocity].every(Number.isFinite))
            throw new Error(`Invalid field sample: ${line}`);
          return {timeMs, position, velocity};
        });
      if (
        samples.length !== 81 ||
        samples[0].timeMs !== 0 ||
        samples.at(-1).timeMs !== 1600
      )
        throw new Error(`Incomplete ${scheme} ${property} trace`);
      const finalTarget = changes.at(-1).target;
      const settledAtMs = samples.find(
        (sample, index) =>
          sample.timeMs >= changes.at(-1).timeMs &&
          samples
            .slice(index)
            .every(
              item =>
                Math.abs(item.position - finalTarget) <= 0.0001 &&
                Math.abs(item.velocity) <= 0.0001,
            ),
      )?.timeMs;
      if (!Number.isFinite(settledAtMs))
        throw new Error(`${scheme} ${property} did not settle`);
      traces[property] = {
        unit: property === 'indicator' ? 'dp' : 'interpolation',
        initial: initial[property],
        changes,
        settledAtMs,
        samples,
      };
    }
    schemes[scheme.toLowerCase()] = traces;
  }
  const result = {
    schemaVersion: 1,
    authority: 'pinned-compose-spring-projection',
    composeCommit: policy.androidxCommit,
    sourceSha256,
    producer: {
      command:
        'M3_ANDROIDX=/path/to/pinned/androidx node internal/material3-migration/sources/field-reference/capture-field-springs.mjs',
      kotlin: '2.4.20',
      java: javaVersion.stderr.split('\n')[0],
      probe:
        'internal/material3-migration/sources/field-reference/FieldSpringProbe.kt',
    },
    sequence: 'focus 0ms, blur 120ms, refocus 160ms, blur 600ms',
    stepMs: 20,
    endMs: 1600,
    schemes,
  };
  const bytes = JSON.stringify(result, null, 2) + '\n';
  const file = path.join(here, 'field-motion.json');
  if (check) {
    if ((await fs.readFile(file, 'utf8')) !== bytes)
      throw new Error('Pinned field motion trace changed');
  } else await fs.writeFile(file, bytes);
  console.log(
    `Captured ${Object.keys(schemes).length} field schemes, ${Object.keys(targets).length} properties, 81 samples each`,
  );
} finally {
  await fs.rm(temporary, {recursive: true, force: true});
}
