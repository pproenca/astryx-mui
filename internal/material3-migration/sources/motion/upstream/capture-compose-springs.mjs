// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned AndroidX SpringSimulation.kt, Compose motion tokens and a local Kotlin compiler cache. @output Independent source trajectories for standard and Expressive spatial/effects springs. @position Disposable foundation motion reference capture. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from '../../../workbook.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.resolve(here, '../..');
const compose = JSON.parse(
  await fs.readFile(path.join(sources, 'compose-inventory.json')),
);
const policy = JSON.parse(
  await fs.readFile(path.join(sources, '../policy.json')),
);
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
const revision = execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (revision !== policy.androidxCommit || compose.commit !== revision)
  throw new Error('AndroidX source revision differs from policy');

const sourceRelative =
  'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringSimulation.kt';
const constantsRelative =
  'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/VectorizedAnimationSpec.kt';
const source = path.join(androidx, sourceRelative);
const sourceSha256 = hash(await fs.readFile(source));
if (
  sourceSha256 !==
  '78ccee541bba54e71666376819ec8b5e961421f0ea21ec34965da493827bf721'
)
  throw new Error('Pinned SpringSimulation.kt changed');
const constants = await fs.readFile(
  path.join(androidx, constantsRelative),
  'utf8',
);
if (
  hash(constants) !==
    '2a3857a7620fcb108972c8886d18a1620fc54247216db6070750c2755c8c9cf9' ||
  !/const val StiffnessVeryLow: Float = 50f/.test(constants) ||
  !/const val DampingRatioNoBouncy: Float = 1f/.test(constants)
)
  throw new Error('Pinned Spring defaults differ from probe support');

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
  throw new Error(
    `Missing local Kotlin compiler dependency: ${group}/${name}/${version}`,
  );
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
const annotations = jars[7];
const compilerClasspath = jars.join(path.delimiter);
const javaVersion = spawnSync('java', ['-version'], {encoding: 'utf8'});
if (javaVersion.status !== 0)
  throw new Error('Could not identify the Java runtime');
const runtime = `kotlinc-jvm 2.4.20; ${javaVersion.stderr.split('\n')[0]}`;
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-compose-springs-'),
);
const output = path.join(temporary, 'classes');
await fs.mkdir(output);

try {
  execFileSync(
    'java',
    [
      '--enable-native-access=ALL-UNNAMED',
      '-cp',
      compilerClasspath,
      'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
      '-no-stdlib',
      '-no-reflect',
      '-classpath',
      [stdlib, annotations].join(path.delimiter),
      '-d',
      output,
      source,
      path.join(here, 'SpringProbeSupport.kt'),
      path.join(here, 'FloatPacking.kt'),
      path.join(here, 'SpringProbe.kt'),
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000},
  );
  const files = {};
  for (const scheme of ['Standard', 'Expressive']) {
    const tokens = new Map(
      compose.tokens
        .find(item => item.name === `${scheme}MotionTokens`)
        .values.map(({name, expression}) => [name, expression]),
    );
    for (const speed of ['Fast', 'Default', 'Slow']) {
      for (const kind of ['Spatial', 'Effects']) {
        const value = suffix => {
          const expression = tokens.get(`Spring${speed}${kind}${suffix}`);
          if (!/^\d+(?:\.\d+)?f$/.test(expression || ''))
            throw new Error(`Unresolved ${scheme} ${speed} ${kind} ${suffix}`);
          return Number(expression.slice(0, -1));
        };
        const dampingRatio = value('Damping');
        const stiffness = value('Stiffness');
        const unit = kind === 'Spatial' ? 'px' : 'opacity';
        const changes =
          kind === 'Spatial'
            ? [
                {timeMs: 0, target: 100},
                {timeMs: 120, target: 40},
                {timeMs: 260, target: 0},
                {timeMs: 600, target: -100},
              ]
            : [
                {timeMs: 0, target: 1},
                {timeMs: 120, target: 0.4},
                {timeMs: 260, target: 0},
                {timeMs: 600, target: 1},
              ];
        const inputs = {
          initialPosition: 0,
          initialVelocity: 0,
          changes,
          dampingRatio,
          stiffness,
          stepMs: 20,
          endMs: 3000,
          settling:
            kind === 'Spatial'
              ? {position: 0.01, velocity: 0.01}
              : {position: 0.0001, velocity: 0.0001},
        };
        const changeArgument = changes
          .map(item => `${item.timeMs}:${item.target}`)
          .join(',');
        const stdout = execFileSync(
          'java',
          [
            '-cp',
            [output, stdlib].join(path.delimiter),
            'androidx.compose.animation.core.SpringProbeKt',
            String(dampingRatio),
            String(stiffness),
            String(inputs.initialPosition),
            String(inputs.initialVelocity),
            changeArgument,
            String(inputs.endMs),
            String(inputs.stepMs),
          ],
          {encoding: 'utf8', maxBuffer: 5_000_000},
        );
        const samples = stdout
          .trim()
          .split('\n')
          .map(line => {
            const [timeMs, position, velocity] = line.split('\t').map(Number);
            if (![timeMs, position, velocity].every(Number.isFinite))
              throw new Error(`Invalid upstream spring sample: ${line}`);
            return {timeMs, position, velocity};
          });
        if (
          samples.length !== 151 ||
          samples[0].timeMs !== 0 ||
          samples.at(-1).timeMs !== 3000
        )
          throw new Error('Upstream spring sample timestamps changed');
        const finalTarget = changes.at(-1).target;
        let settledAtMs = null;
        for (const sample of samples.filter(item => item.timeMs >= 600)) {
          if (
            samples
              .filter(item => item.timeMs >= sample.timeMs)
              .every(
                item =>
                  Math.abs(item.position - finalTarget) <=
                    inputs.settling.position &&
                  Math.abs(item.velocity) <= inputs.settling.velocity,
              )
          ) {
            settledAtMs = sample.timeMs;
            break;
          }
        }
        if (settledAtMs === null)
          throw new Error(`${scheme} ${speed} ${kind} did not settle`);
        const id = `${scheme}-${speed}-${kind}`.toLowerCase();
        const trace = {
          producer: {
            kind: 'upstream',
            commit: revision,
            source: sourceRelative,
            command:
              'node internal/material3-migration/sources/motion/upstream/capture-compose-springs.mjs',
            runtime,
          },
          unit,
          inputs,
          settledAtMs,
          samples,
        };
        const file = `${id}.json`;
        const bytes = `${JSON.stringify(trace, null, 2)}\n`;
        const target = path.join(here, 'traces', file);
        files[id] = {file: `traces/${file}`, sha256: hash(bytes), settledAtMs};
        if (process.argv.includes('--check')) {
          if ((await fs.readFile(target, 'utf8')) !== bytes)
            throw new Error(`Upstream motion trace changed: ${file}`);
        } else {
          await fs.mkdir(path.dirname(target), {recursive: true});
          await fs.writeFile(target, bytes);
        }
      }
    }
  }
  const manifest = {
    schemaVersion: 1,
    commit: revision,
    source: sourceRelative,
    sourceSha256,
    constantsSource: constantsRelative,
    constantsSha256: hash(constants),
    compiler: 'kotlinc-jvm 2.4.20',
    runtime,
    files,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const target = path.join(here, 'manifest.json');
  if (process.argv.includes('--check')) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Upstream motion trace manifest changed');
  } else await fs.writeFile(target, bytes);
  console.log(
    JSON.stringify({traces: Object.keys(files).length, sourceSha256, runtime}),
  );
} finally {
  await fs.rm(temporary, {recursive: true, force: true});
}
