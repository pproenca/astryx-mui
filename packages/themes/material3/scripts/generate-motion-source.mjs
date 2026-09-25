// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-motion-source.mjs
 * @input Pinned Material Web checkout and Sass CLI
 * @output material3MotionSource.json or an exact --check comparison
 * @position Reproducible Material 3 motion and state-source extraction
 */

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const repo = option('--source-dir');
const sass = option('--sass-bin');
if (!repo || !sass) {
  throw new Error(
    'Usage: generate-motion-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]',
  );
}
const sourceCommit = 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3';
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
});
if (
  revision.error ||
  revision.status !== 0 ||
  revision.stdout.trim() !== sourceCommit
) {
  throw new Error(`Material Web checkout must be ${sourceCommit}`);
}
const motionSource = fs.readFileSync(
  path.join(repo, 'tokens/versions/v0_192/_md-sys-motion.scss'),
  'utf8',
);
if (
  !/'path':\s*\/\* Type "motion_path" is not supported\. \*\/ null/.test(
    motionSource,
  )
) {
  throw new Error(
    'Expected unsupported motion path marker in pinned Material Web source.',
  );
}
const scss = `
@use 'tokens/md-sys-motion' as motion;
@use 'tokens/md-sys-state' as state;
:root {
  @each $key, $value in motion.values() {
    @if $value != null { --m3-motion-#{$key}: #{$value}; }
  }
  @each $key, $value in state.values() {
    @if $value != null { --m3-state-#{$key}: #{$value}; }
  }
}
`;
const compiled = spawnSync(
  sass,
  ['--stdin', `--load-path=${repo}`, '--no-source-map'],
  {
    input: scss,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  },
);
if (compiled.error || compiled.status !== 0)
  throw new Error(compiled.stderr || String(compiled.error));
const motion = {};
const state = {};
for (const match of compiled.stdout.matchAll(
  /--m3-(motion|state)-([a-z0-9-]+):\s*([^;]+);/g,
)) {
  (match[1] === 'motion' ? motion : state)[match[2]] = match[3].trim();
}
const durations = Object.fromEntries(
  Object.entries(motion).filter(([key]) => key.startsWith('duration-')),
);
const easings = Object.fromEntries(
  Object.entries(motion).filter(([key]) => key.startsWith('easing-')),
);
const stateLayerOpacity = Object.fromEntries(
  Object.entries(state).map(([key, value]) => {
    const number = Number(value);
    if (
      !key.endsWith('-state-layer-opacity') ||
      !Number.isFinite(number) ||
      number < 0 ||
      number > 1
    ) {
      throw new Error(`Unexpected state-layer role: ${key}=${value}`);
    }
    return [key, number];
  }),
);
if (
  Object.keys(motion).length !== 26 ||
  Object.keys(durations).length !== 16 ||
  Object.keys(easings).length !== 10 ||
  Object.keys(stateLayerOpacity).length !== 4
) {
  throw new Error('Unexpected Material Web motion or state wrapper values.');
}
const data = {
  sourceCommit,
  durations,
  easings,
  stateLayerOpacity,
  unsupportedPath: null,
};
const output = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/material3MotionSource.json',
);
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated)
    throw new Error('Material 3 motion data differs from pinned Sass output.');
  console.log(
    'Motion source matches pinned Sass: 16 durations, 10 easings, 4 state opacities; path unsupported.',
  );
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${sourceCommit}.`);
}
