// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material shadow geometry: Copyright Google LLC, Apache-2.0.

/** @input Pinned Material Web shadow source, retained source PNGs, built native Elevation and Material token CSS. @output Exact light/dark full-matrix source/native comparisons and optional native captures. @position Permanent native Elevation reference regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
import {chromium} from 'playwright';
import {Elevation} from '../dist/Elevation/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(await fs.readFile(
  path.join(root, '../themes/material3/src/material3ElevationSource.json'),
  'utf8',
));
assert.equal(source.sourceCommit, 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3');
const referenceRoot = path.join(root, 'fixtures/references/elevation/native-shadow');
const captureRoot = process.env.M3_CAPTURE_DIR || '';
const updateReference = process.argv.includes('--update-reference');
const checkCapture = process.argv.includes('--check-capture');
const tokens = await fs.readFile(path.join(root, 'dist/tokens.css'), 'utf8');
const components = await fs.readFile(path.join(root, 'dist/components.css'), 'utf8');

function sourceLayer(level) {
  const geometry = source.layers[`level${level}`];
  const layer = kind =>
    `<span style="position:absolute;inset:0;display:block;border-radius:inherit;pointer-events:none;box-shadow:${geometry[kind].boxShadow.replace(source.sampleColor, 'var(--md-sys-color-shadow)')};opacity:${geometry[kind].opacity}"></span>`;
  return `<span aria-hidden="true" style="position:absolute;inset:0;display:block;border-radius:inherit;pointer-events:none">${layer('key')}${layer('ambient')}</span>`;
}

function html(mode, native) {
  const cards = Array.from({length: 6}, (_, level) =>
    `<div class="tile"><div class="owner">${native
      ? renderToStaticMarkup(createElement(Elevation, {level}))
      : sourceLayer(level)
    }</div></div>`,
  ).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${tokens}\n${components}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:360px}
    body{background:var(--md-sys-color-surface-container-lowest)}
    .matrix{display:grid;grid-template-columns:repeat(3,260px);grid-template-rows:repeat(2,124px);gap:28px 40px;padding:42px 50px}
    .tile{width:260px;height:124px;display:grid;place-items:center}
    .owner{position:relative;width:152px;height:78px;border-radius:16px;background:var(--md-sys-color-surface)}
  </style></head><body data-md-scheme="${mode}"><main class="matrix">${cards}</main></body></html>`;
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode, false));
    const sourcePng = await page.screenshot();
    const referencePath = path.join(referenceRoot, `elevation-${mode}.png`);
    if (updateReference) {
      await fs.mkdir(referenceRoot, {recursive: true});
      await fs.writeFile(referencePath, sourcePng);
    } else {
      assert.ok((await fs.readFile(referencePath)).equals(sourcePng),
        `${mode} pinned source projection changed`);
    }
    await page.setContent(html(mode, true));
    const actualPng = await page.screenshot();
    const sourceImage = PNG.sync.read(sourcePng);
    const actualImage = PNG.sync.read(actualPng);
    const changed = pixelmatch(
      sourceImage.data,
      actualImage.data,
      null,
      960,
      360,
      {threshold: 0, includeAA: true},
    );
    assert.equal(changed, 0, `${mode} native shadow matrix changed ${changed} pixels`);
    if (captureRoot) {
      const actualPath = path.join(captureRoot, `elevation-${mode}.png`);
      if (checkCapture) {
        assert.ok((await fs.readFile(actualPath)).equals(actualPng),
          `${mode} native capture changed`);
      } else {
        await fs.mkdir(captureRoot, {recursive: true});
        await fs.writeFile(actualPath, actualPng);
      }
    }
    await page.close();
    console.log(`${mode}: six native levels, 0 changed pixels`);
  }
} finally {
  await browser.close();
}
