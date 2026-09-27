// Copyright (c) Meta Platforms, Inc. and affiliates.
// Shape reversal and spring equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Button and AnimatedShape source, effects spring tokens and AndroidX SpringSimulation.
 * @output A reproducible interrupted pressed-shape trajectory for the shared Button family.
 * @position Disposable Compose source evidence before native Button implementation.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
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

const sourceFiles = {
  button: {
    path: 'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt',
    sha256: '9095ad12e5b26a20bf0cdc53ba01f54b7c8ca41ba4ece933d578ef28a2d97240',
  },
  animatedShape: {
    path: 'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/AnimatedShape.kt',
    sha256: '246f81812dfae94e6532848370b38b9b118ba07b38d95b0ebc5df24ceee5ebe1',
  },
  standardMotion: {
    path: 'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt',
    sha256: '4b36c30679dcc0b1ec6010e4e40c070901151b59252d9a21d0e4348511370592',
  },
  expressiveMotion: {
    path: 'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt',
    sha256: 'deefcefc93405c69445071b40e4d9894458bb20cff18b805192c90aea5ba6c73',
  },
  spring: {
    path: 'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringSimulation.kt',
    sha256: '78ccee541bba54e71666376819ec8b5e961421f0ea21ec34965da493827bf721',
  },
};
const source = {};
for (const [name, item] of Object.entries(sourceFiles)) {
  const bytes = await fs.readFile(path.join(androidx, item.path));
  if (sha256(bytes) !== item.sha256)
    throw new Error(`Pinned Compose source changed: ${item.path}`);
  source[name] = bytes.toString('utf8');
}
if (
  !/MotionSchemeKeyTokens\.DefaultEffects\.value<Float>\(\)/.test(
    source.button,
  ) ||
  !/progress\.snapTo\(1f - p\)/.test(source.animatedShape) ||
  !/initialVelocity = -v/.test(source.animatedShape)
)
  throw new Error('Pinned Button shape motion binding changed');
for (const name of ['standardMotion', 'expressiveMotion']) {
  if (
    !/SpringDefaultEffectsDamping = 1\.0f/.test(source[name]) ||
    !/SpringDefaultEffectsStiffness = 1600\.0f/.test(source[name])
  )
    throw new Error(`Pinned ${name} effects spring changed`);
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
const javaVersion = spawnSync('java', ['-version'], {encoding: 'utf8'});
if (javaVersion.status !== 0) throw new Error('Java runtime unavailable');
const runtime = `kotlinc-jvm 2.4.20; ${javaVersion.stderr.split('\n')[0]}`;
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-button-probe-'),
);
const output = path.join(temporary, 'classes');
await fs.mkdir(output);
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
      [jars[2], jars[7]].join(path.delimiter),
      '-d',
      output,
      path.join(androidx, sourceFiles.spring.path),
      path.join(
        repo,
        'internal/material3-migration/sources/motion/upstream/SpringProbeSupport.kt',
      ),
      path.join(
        repo,
        'internal/material3-migration/sources/motion/upstream/FloatPacking.kt',
      ),
      path.join(here, 'ButtonShapeProbe.kt'),
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000},
  );
  const stdout = execFileSync(
    'java',
    [
      '-cp',
      [output, jars[2]].join(path.delimiter),
      'androidx.compose.animation.core.ButtonShapeProbeKt',
      '1',
      '1600',
      '1200',
    ],
    {encoding: 'utf8', maxBuffer: 5_000_000},
  );
  const samples = stdout
    .trim()
    .split('\n')
    .map(line => {
      const [timeMs, pressedFraction, velocity] = line.split('\t').map(Number);
      if (![timeMs, pressedFraction, velocity].every(Number.isFinite))
        throw new Error(`Invalid Compose Button shape sample: ${line}`);
      return {timeMs, pressedFraction, velocity};
    });
  if (samples.length !== 61 || samples.at(-1).timeMs !== 1200)
    throw new Error('Button shape sample timeline changed');
  const settledAtMs = samples.find(
    sample =>
      sample.timeMs >= 600 &&
      samples
        .filter(later => later.timeMs >= sample.timeMs)
        .every(
          later =>
            Math.abs(later.pressedFraction) <= 0.0001 &&
            Math.abs(later.velocity) <= 0.0001,
        ),
  )?.timeMs;
  if (settledAtMs === undefined)
    throw new Error('Button shape did not settle by the end of the probe');
  const trace = {
    schemaVersion: 1,
    producer: {
      kind: 'upstream',
      commit: policy.androidxCommit,
      source: sourceFiles.spring.path,
      command:
        'node internal/material3-migration/sources/button-reference/capture-button-shape.mjs',
      runtime,
    },
    schemes: ['standard', 'expressive'],
    unit: 'pressed-shape-fraction',
    inputs: {
      dampingRatio: 1,
      stiffness: 1600,
      changes: [
        {timeMs: 0, pressed: true},
        {timeMs: 120, pressed: false},
        {timeMs: 160, pressed: true},
        {timeMs: 600, pressed: false},
      ],
      stepMs: 20,
      endMs: 1200,
    },
    settledAtMs,
    samples,
  };
  const traceBytes = `${JSON.stringify(trace, null, 2)}\n`;
  const tracePath = path.join(here, 'button-shape-motion.json');
  if (check) {
    if ((await fs.readFile(tracePath, 'utf8')) !== traceBytes)
      throw new Error('Button shape trace changed');
  } else await fs.writeFile(tracePath, traceBytes);
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    sourceFiles,
    runtime,
    traceSha256: sha256(traceBytes),
    settledAtMs,
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestPath = path.join(here, 'manifest.json');
  if (check) {
    if ((await fs.readFile(manifestPath, 'utf8')) !== manifestBytes)
      throw new Error('Button shape manifest changed');
  } else await fs.writeFile(manifestPath, manifestBytes);
  console.log(JSON.stringify({samples: samples.length, settledAtMs, runtime}));
} finally {
  await fs.rm(temporary, {recursive: true, force: true});
}
