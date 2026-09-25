// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-spatial-source.mjs
 * @input Pinned Material Web component wrappers and Sass CLI
 * @output material3SpatialSource.json or an exact --check comparison
 * @position Reproducible Material 3 component-geometry inventory
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
    'Usage: generate-spatial-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]',
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
const components = [
  'filled-button',
  'outlined-button',
  'text-button',
  'icon-button',
  'list-item',
  'menu-item',
  'checkbox',
  'switch',
  'filled-text-field',
  'outlined-text-field',
];
const tokensDir = path.join(repo, 'tokens');
if (
  fs
    .readdirSync(tokensDir)
    .some(name => /^_md-sys-(spacing|size|density)\.scss$/.test(name))
) {
  throw new Error(
    'Pinned Material Web now has system spatial wrappers; update this mapping.',
  );
}
const wrapperText = Object.fromEntries(
  components.map(name => [
    name,
    fs.readFileSync(path.join(tokensDir, `_md-comp-${name}.scss`), 'utf8'),
  ]),
);
const keysIn = (name, label) => {
  const match = wrapperText[name].match(
    new RegExp(`\\$${label}:\\s*\\((.*?)\\);`, 's'),
  );
  if (!match) throw new Error(`Missing ${label} in ${name} wrapper`);
  return new Set(
    [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map(found => found[1]),
  );
};
const scss = `${components
  .map((name, index) => `@use 'tokens/md-comp-${name}' as c${index};`)
  .join('\n')}
:root {
${components
  .map(
    (
      name,
      index,
    ) => `  @each $key, $value in c${index}.values($exclude-custom-properties: true) {
    @if $value != null { --spatial-${index}-#{$key}: #{$value}; }
  }`,
  )
  .join('\n')}
}`;
const compiled = spawnSync(
  sass,
  ['--stdin', `--load-path=${repo}`, '--no-source-map'],
  {
    input: scss,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  },
);
if (compiled.error || compiled.status !== 0)
  throw new Error(compiled.stderr || String(compiled.error));
const allValues = Object.fromEntries(components.map(name => [name, {}]));
for (const match of compiled.stdout.matchAll(
  /--spatial-(\d+)-([a-z0-9-]+):\s*([^;]+);/g,
)) {
  allValues[components[Number(match[1])]][match[2]] = match[3].trim();
}
const isSpatial = key =>
  /(?:^|-)(?:height|width|space|size)$/.test(key) &&
  !/(?:-line-height|-text-(?:populated-)?size)$/.test(key);
const data = {
  sourceCommit,
  systemSpacingRoles: 0,
  systemSizeRoles: 0,
  systemDensityRoles: 0,
  components: Object.fromEntries(
    components.map(name => {
      const supported = keysIn(name, 'supported-tokens');
      const unsupported = keysIn(name, 'unsupported-tokens');
      const roles = Object.fromEntries(
        Object.entries(allValues[name])
          .filter(([key]) => isSpatial(key))
          .map(([key, value]) => {
            if (!supported.has(key) && !unsupported.has(key)) {
              throw new Error(`Unclassified spatial role ${name}.${key}`);
            }
            return [key, {value, cssExposed: supported.has(key)}];
          }),
      );
      if (!Object.keys(roles).length)
        throw new Error(`No spatial roles in ${name}`);
      return [name, roles];
    }),
  ),
};
const output = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/material3SpatialSource.json',
);
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated)
    throw new Error('Material 3 geometry differs from pinned Sass output.');
  console.log(
    `Spatial source matches pinned Sass: ${components.length} component wrappers, ${Object.values(data.components).reduce((n, roles) => n + Object.keys(roles).length, 0)} geometry roles; no system spacing/size/density wrappers.`,
  );
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${sourceCommit}.`);
}
