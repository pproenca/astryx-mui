// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-elevation-source.mjs
 * @input Pinned Material Web Sass and local Chrome
 * @output material3ElevationSource.json or an exact --check comparison
 * @position Reproducible extraction of Material 3 elevation levels and layers
 */

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const repo = option('--source-dir');
const sass = option('--sass-bin');
if (!repo || !sass) {
  throw new Error(
    'Usage: generate-elevation-source.mjs --source-dir <pinned-material-web> --sass-bin <sass> [--check]',
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
const scss = `
@use 'tokens/md-sys-elevation' as system;
@use 'tokens/versions/v0_192/md-sys-elevation' as generated;
@use 'elevation/internal/elevation' as component;
:root {
  @each $key, $value in system.values() { --system-#{$key}: #{$value}; }
  @each $key, $value in generated.values() { --generated-#{$key}: #{$value}; }
}
@include component.styles;
`;
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
const systemLevels = {};
const generatedDp = {};
for (const match of compiled.stdout.matchAll(
  /--(system|generated)-(level[0-5]):\s*(\d+);/g,
)) {
  (match[1] === 'system' ? systemLevels : generatedDp)[match[2]] = Number(
    match[3],
  );
}
if (
  Object.keys(systemLevels).length !== 6 ||
  Object.keys(generatedDp).length !== 6 ||
  Object.entries(systemLevels).some(
    ([name, level]) => level !== Number(name.slice(-1)),
  )
) {
  throw new Error('Unexpected Material Web elevation levels.');
}
const browser = await chromium.launch({channel: 'chrome', headless: true});
let layers;
try {
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html><head><style>${compiled.stdout}</style></head><body></body></html>`,
  );
  layers = await page.evaluate(() => {
    const result = {};
    for (let level = 0; level <= 5; level++) {
      const node = document.createElement('div');
      node.className = 'shadow';
      node.style.setProperty('--md-elevation-level', String(level));
      node.style.setProperty('--md-elevation-shadow-color', 'rgb(1, 2, 3)');
      document.body.append(node);
      const key = getComputedStyle(node, '::before');
      const ambient = getComputedStyle(node, '::after');
      result[`level${level}`] = {
        key: {boxShadow: key.boxShadow, opacity: Number(key.opacity)},
        ambient: {
          boxShadow: ambient.boxShadow,
          opacity: Number(ambient.opacity),
        },
      };
      node.remove();
    }
    return result;
  });
} finally {
  await browser.close();
}
for (const [name, layer] of Object.entries(layers)) {
  if (
    layer.key.opacity !== 0.3 ||
    layer.ambient.opacity !== 0.15 ||
    !/^rgb\(1, 2, 3\) 0px \d+px \d+px \d+px$/.test(layer.key.boxShadow) ||
    !/^rgb\(1, 2, 3\) 0px \d+px \d+px \d+px$/.test(layer.ambient.boxShadow)
  ) {
    throw new Error(
      `Unexpected computed Material Web elevation layer ${name}: ${JSON.stringify(layer)}`,
    );
  }
}
const data = {
  sourceCommit,
  systemLevels,
  generatedDp,
  componentCssProperties: [
    '--md-elevation-level',
    '--md-elevation-shadow-color',
  ],
  sampleColor: 'rgb(1, 2, 3)',
  layers,
};
const output = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/material3ElevationSource.json',
);
const generated = JSON.stringify(data, null, 2) + '\n';
if (args.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated)
    throw new Error(
      'Material 3 elevation data differs from pinned Sass/Chrome output.',
    );
  console.log(
    'Elevation source matches pinned Sass/Chrome: six web levels and two shadow layers each.',
  );
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${sourceCommit}.`);
}
