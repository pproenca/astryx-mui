// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose Ripple, SpringSimulation, motion tokens and local Kotlin compiler cache.
 * @output Standard and Expressive focus/blur interruption trajectories.
 * @position Disposable source motion reference for the native FocusRing comparison.
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
  throw new Error(
    'Pinned AndroidX checkout is not clean at the selected revision',
  );

const upstream = path.join(sources, 'motion/upstream');
const files = {
  spring: {
    path: 'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringSimulation.kt',
    sha256: '78ccee541bba54e71666376819ec8b5e961421f0ea21ec34965da493827bf721',
  },
  constants: {
    path: 'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/VectorizedAnimationSpec.kt',
    sha256: '2a3857a7620fcb108972c8886d18a1620fc54247216db6070750c2755c8c9cf9',
  },
  materialRipple: {
    path: 'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Ripple.kt',
    sha256: '4b53b7ffb01ff48014cdc2f6af216c97f6463d5e25343d9db699ea4abb90bc00',
  },
  rippleNode: {
    path: 'compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/Ripple.kt',
    sha256: 'f0ba3e8b3d5b40d3977f7e4dcbf2c93dec02e19705a1141f8efe6dc81c2f0aa7',
  },
};
for (const item of Object.values(files)) {
  if (sha256(await fs.readFile(path.join(androidx, item.path))) !== item.sha256)
    throw new Error(`Pinned Compose source changed: ${item.path}`);
}
const constants = await fs.readFile(
  path.join(androidx, files.constants.path),
  'utf8',
);
if (
  !/const val StiffnessVeryLow: Float = 50f/.test(constants) ||
  !/const val DampingRatioNoBouncy: Float = 1f/.test(constants)
)
  throw new Error('Pinned spring default constants changed');

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
    `Missing local Kotlin dependency: ${group}/${name}/${version}`,
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
const javaVersion = spawnSync('java', ['-version'], {encoding: 'utf8'});
if (javaVersion.status !== 0) throw new Error('Java runtime unavailable');
const runtime = `kotlinc-jvm 2.4.20; ${javaVersion.stderr.split('\n')[0]}`;
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-focus-probe-'),
);
const output = path.join(temporary, 'classes');
await fs.mkdir(output);

const spec = (scheme, kind) => {
  const tokens = new Map(
    inventory.tokens
      .find(item => item.name === `${scheme}MotionTokens`)
      .values.map(({name, expression}) => [name, expression]),
  );
  const number = suffix => {
    const expression = tokens.get(`SpringFast${kind}${suffix}`);
    if (!/^\d+(?:\.\d+)?f$/.test(expression || ''))
      throw new Error(`Unresolved ${scheme} fast ${kind} ${suffix}`);
    return Number(expression.slice(0, -1));
  };
  return {damping: number('Damping'), stiffness: number('Stiffness')};
};
const check = process.argv.includes('--check');
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
      path.join(androidx, files.spring.path),
      path.join(upstream, 'SpringProbeSupport.kt'),
      path.join(upstream, 'FloatPacking.kt'),
      path.join(here, 'FocusProbe.kt'),
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000},
  );
  const traces = {};
  for (const scheme of ['Standard', 'Expressive']) {
    const spatial = spec(scheme, 'Spatial');
    const effects = spec(scheme, 'Effects');
    const changes = [
      {timeMs: 0, target: 1, ...spatial, interaction: 'focus'},
      {timeMs: 120, target: 0, ...effects, interaction: 'blur'},
      {timeMs: 160, target: 1, ...spatial, interaction: 'refocus'},
      {timeMs: 600, target: 0, ...effects, interaction: 'blur'},
    ];
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
        'androidx.compose.animation.core.FocusProbeKt',
        argument,
        '1200',
        '20',
        '0',
      ],
      {encoding: 'utf8', maxBuffer: 5_000_000},
    );
    const samples = stdout
      .trim()
      .split('\n')
      .map(line => {
        const [timeMs, position, velocity] = line.split('\t').map(Number);
        if (![timeMs, position, velocity].every(Number.isFinite))
          throw new Error(`Invalid Compose focus sample: ${line}`);
        return {timeMs, position, velocity};
      });
    if (
      samples.length !== 61 ||
      samples[0].timeMs !== 0 ||
      samples.at(-1).timeMs !== 1200
    )
      throw new Error('Focus sample timeline changed');
    let settledAtMs = null;
    for (const sample of samples.filter(item => item.timeMs >= 600)) {
      if (
        samples
          .filter(item => item.timeMs >= sample.timeMs)
          .every(
            item =>
              Math.abs(item.position) <= 0.0001 &&
              Math.abs(item.velocity) <= 0.0001,
          )
      ) {
        settledAtMs = sample.timeMs;
        break;
      }
    }
    if (settledAtMs === null)
      throw new Error(`${scheme} focus interpolation did not settle`);
    const trace = {
      producer: {
        kind: 'upstream',
        commit: policy.androidxCommit,
        source: files.spring.path,
        command:
          'node internal/material3-migration/sources/indication-reference/capture-focus-springs.mjs',
        runtime,
      },
      unit: 'focus-interpolation',
      inputs: {
        initialPosition: 0,
        initialVelocity: 0,
        changes,
        stepMs: 20,
        endMs: 1200,
      },
      settledAtMs,
      samples,
    };
    const name = `${scheme.toLowerCase()}-focus.json`;
    const bytes = `${JSON.stringify(trace, null, 2)}\n`;
    const target = path.join(here, name);
    if (check) {
      if ((await fs.readFile(target, 'utf8')) !== bytes)
        throw new Error(`Focus trace changed: ${name}`);
    } else await fs.writeFile(target, bytes);
    traces[scheme.toLowerCase()] = {
      file: `internal/material3-migration/sources/indication-reference/${name}`,
      sha256: sha256(bytes),
      settledAtMs,
    };
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    sourceFiles: files,
    runtime,
    traces,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const target = path.join(here, 'focus-manifest.json');
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Focus manifest changed');
  } else await fs.writeFile(target, bytes);
  console.log(JSON.stringify({traces, runtime}));
} finally {
  await fs.rm(temporary, {recursive: true, force: true});
}
