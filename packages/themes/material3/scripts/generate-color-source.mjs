// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-color-source.mjs
 * @input Pinned Material Web checkout and Sass CLI
 * @output material3ColorSource.json or an exact --check comparison
 * @position Reproducible Material 3 color-source extraction; not a normal theme build step
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
  throw new Error('Usage: generate-color-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]');
}
const expectedCommit = 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3';
const commit = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).stdout.trim();
if (commit !== expectedCommit) throw new Error(`Unexpected Material Web revision: ${commit}`);

const scss = `
@use 'tokens/md-ref-palette' as palette;
@use 'tokens/md-sys-color' as color;
:root {
  @each $key, $value in palette.values() { --palette-#{$key}: #{$value}; }
  @each $key, $value in color.values-light($exclude-custom-properties: true) { --light-#{$key}: #{$value}; }
  @each $key, $value in color.values-dark($exclude-custom-properties: true) { --dark-#{$key}: #{$value}; }
}
`;
const compiled = spawnSync(sass, ['--stdin', `--load-path=${repo}`, '--no-source-map'], {
  input: scss, encoding: 'utf8', maxBuffer: 1024 * 1024,
});
if (compiled.error || compiled.status !== 0) throw new Error(compiled.stderr || String(compiled.error));
const palette = {};
const light = {};
const dark = {};
for (const match of compiled.stdout.matchAll(/--(palette|light|dark)-([a-z0-9-]+):\s*(#[0-9a-fA-F]+);/g)) {
  ({palette, light, dark})[match[1]][match[2]] = match[3].toLowerCase();
}
const source = fs.readFileSync(path.join(repo, 'tokens/versions/v0_192/_md-sys-color.scss'), 'utf8');
const references = {};
for (const [mode, nextMode] of [['dark', 'light'], ['light', null]]) {
  const start = source.indexOf(`@function values-${mode}(`);
  const end = nextMode ? source.indexOf(`@function values-${nextMode}(`) : source.length;
  const body = source.slice(start, end);
  const roles = {};
  for (const match of body.matchAll(/'([a-z0-9-]+)':\s*map\.get\(\$deps,\s*'md-ref-palette',\s*'([a-z0-9-]+)'\)/g)) {
    roles[match[1]] = match[2];
  }
  references[mode] = roles;
}
if (Object.keys(palette).length !== 91 || Object.keys(light).length !== 49 ||
    Object.keys(dark).length !== 49 || Object.keys(references.light).length !== 49 ||
    Object.keys(references.dark).length !== 49) {
  throw new Error(`Unexpected source counts: ${Object.keys(palette).length}, ${Object.keys(light).length}, ${Object.keys(dark).length}, ${Object.keys(references.light).length}, ${Object.keys(references.dark).length}`);
}
for (const mode of ['light', 'dark']) {
  for (const [role, tone] of Object.entries(references[mode])) {
    if (palette[tone] !== ({light, dark})[mode][role]) {
      throw new Error(`${mode}.${role} does not resolve from palette.${tone}`);
    }
  }
}
const data = {sourceCommit: commit, palette, lightRolePaletteKeys: references.light,
  darkRolePaletteKeys: references.dark, lightResolved: light, darkResolved: dark};
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/material3ColorSource.json');
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated) throw new Error('Material 3 color source differs from pinned Sass output.');
  console.log(`Color source matches ${commit}: ${Object.keys(palette).length} palette stops and ${Object.keys(light).length} roles per mode.`);
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${commit}.`);
}
