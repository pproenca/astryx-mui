// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-typography-source.mjs
 * @input Pinned Material Web checkout and Sass CLI
 * @output material3TypographySource.json or an exact --check comparison
 * @position Reproducible Material 3 type-source extraction; not a normal theme build step
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
  throw new Error('Usage: generate-typography-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]');
}
const expectedCommit = 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3';
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'});
if (revision.error || revision.status !== 0 || revision.stdout.trim() !== expectedCommit) {
  throw new Error(`Material Web checkout must be ${expectedCommit}`);
}

const scss = `
@use 'sass:string';
@use 'tokens/md-ref-typeface' as face;
@use 'tokens/md-sys-typescale' as scale;
@use 'tokens/versions/v0_192/md-sys-typescale' as generated;
$deps: ('md-ref-typeface': face.values($exclude-custom-properties: true));
:root {
  @each $key, $value in face.values($exclude-custom-properties: true) { --face-#{$key}: #{$value}; }
  @each $key, $value in scale.values($deps: $deps, $exclude-custom-properties: true) { --scale-#{$key}: #{$value}; }
  @each $key, $value in generated.values() {
    @if string.index($key, '-tracking') { --tracking-#{$key}: #{$value}; }
  }
}
`;
const compiled = spawnSync(sass, ['--stdin', `--load-path=${repo}`, '--no-source-map'], {
  input: scss, encoding: 'utf8', maxBuffer: 1024 * 1024,
});
if (compiled.error || compiled.status !== 0) throw new Error(compiled.stderr || String(compiled.error));
const typeface = {};
const typescale = {};
const sourceOnlyTracking = {};
const groups = {face: typeface, scale: typescale, tracking: sourceOnlyTracking};
for (const match of compiled.stdout.matchAll(/--(face|scale|tracking)-([a-z0-9-]+):\s*([^;]+);/g)) {
  groups[match[1]][match[2]] = match[3].trim();
}
if (Object.keys(typeface).length !== 5 || Object.keys(typescale).length !== 62 ||
    Object.keys(sourceOnlyTracking).length !== 15) {
  throw new Error(`Unexpected type counts: ${Object.keys(typeface).length}, ${Object.keys(typescale).length}, ${Object.keys(sourceOnlyTracking).length}`);
}
const data = {sourceCommit: expectedCommit, typeface, typescale, sourceOnlyTracking};
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/material3TypographySource.json');
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated) throw new Error('Material 3 typography data differs from pinned Sass output.');
  console.log('Typography source matches pinned Sass: 5 typeface, 62 active typescale, 15 source-only tracking roles.');
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${expectedCommit}.`);
}
