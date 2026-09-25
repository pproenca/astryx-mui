// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-shape-source.mjs
 * @input Pinned Material Web checkout and Sass CLI
 * @output material3ShapeSource.json or an exact --check comparison
 * @position Reproducible Material 3 shape-source extraction
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
  throw new Error('Usage: generate-shape-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]');
}
const expectedCommit = 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3';
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'});
if (revision.error || revision.status !== 0 || revision.stdout.trim() !== expectedCommit) {
  throw new Error(`Material Web checkout must be ${expectedCommit}`);
}
const wrapper = fs.readFileSync(path.join(repo, 'tokens/_md-sys-shape.scss'), 'utf8');
const keysIn = label => {
  const match = wrapper.match(new RegExp(`\\$${label}:\\s*\\((.*?)\\);`, 's'));
  if (!match) throw new Error(`Missing ${label} in shape wrapper`);
  return [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map(found => found[1]);
};
const cssKeys = keysIn('supported-tokens');
const sassOnlyKeys = keysIn('unsupported-tokens');
const scss = `
@use 'tokens/md-sys-shape' as shape;
:root {
  @each $key, $value in shape.values($exclude-custom-properties: true) {
    --shape-#{$key}: #{$value};
  }
}
`;
const compiled = spawnSync(sass, ['--stdin', `--load-path=${repo}`, '--no-source-map'], {
  input: scss, encoding: 'utf8', maxBuffer: 1024 * 1024,
});
if (compiled.error || compiled.status !== 0) throw new Error(compiled.stderr || String(compiled.error));
const values = {};
for (const match of compiled.stdout.matchAll(/--shape-([a-z0-9-]+):\s*([^;]+);/g)) {
  values[match[1]] = match[2].trim();
}
if (cssKeys.length !== 7 || sassOnlyKeys.length !== 5 || Object.keys(values).length !== 12 ||
    [...cssKeys, ...sassOnlyKeys].some(key => !(key in values))) {
  throw new Error('Unexpected Material Web shape wrapper keys.');
}
const data = {
  sourceCommit: expectedCommit,
  cssCorners: Object.fromEntries(cssKeys.map(key => [key, values[key]])),
  sassOnlyCornerLists: Object.fromEntries(sassOnlyKeys.map(key => {
    const corners = values[key].split(', ');
    if (corners.length !== 4) throw new Error(`Expected four Sass corners for ${key}`);
    return [key, corners];
  })),
};
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/material3ShapeSource.json');
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated) throw new Error('Material 3 shape data differs from pinned Sass output.');
  console.log('Shape source matches pinned Sass: 7 CSS corner roles and 5 Sass-only corner lists.');
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${expectedCommit}.`);
}
