// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native CSS, pinned color captures and Chrome. @output 35 matched 49-role pixel comparisons and scoped override checks. @position Permanent native foundation browser regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';
import {
  material3ColorValues,
  material3KitModeNames,
  material3TokenCss,
  material3TypeStyles,
  material3TokenValues,
} from '../dist/index.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceRoot = path.join(packageRoot, 'fixtures/references/color');
const manifest = JSON.parse(
  await fs.readFile(path.join(referenceRoot, 'manifest.json'), 'utf8'),
);
const css = await fs.readFile(path.join(packageRoot, 'dist/tokens.css'), 'utf8');
assert.equal(
  css,
  `/* Copyright (c) Meta Platforms, Inc. and affiliates. */\n${material3TokenCss()}`,
  'Built CSS must be emitted by the runtime value graph',
);
assert.deepEqual(manifest.roles, [...manifest.roles].sort());
assert.equal(manifest.roles.length, 49);

const hexRgb = value => {
  const hex = value.slice(1);
  const digits =
    hex.length === 3 ? [...hex].map(char => char + char).join('') : hex;
  return `rgb(${[0, 2, 4].map(i => Number.parseInt(digits.slice(i, i + 2), 16)).join(', ')})`;
};
const html = `<!doctype html><html><head><style>${css}
html, body { margin: 0; width: ${manifest.width}px; height: ${manifest.height}px; }
#swatches { display: grid; grid-template-columns: repeat(${manifest.columns}, ${manifest.tilePx}px); }
.swatch { width: ${manifest.tilePx}px; height: ${manifest.tilePx}px; }
</style></head><body><div id="swatches">${manifest.roles
  .map(
    role =>
      `<div class="swatch" data-role="${role}" style="background-color: var(--md-sys-color-${role})"></div>`,
  )
  .join('')}</div></body></html>`;

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({
    viewport: {width: manifest.width, height: manifest.height},
    deviceScaleFactor: 1,
  });
  await page.setContent(html);
  const schemes = [
    ['light', 'light'],
    ['dark', 'dark'],
    ['expressive-light', 'expressiveLight'],
    ...material3KitModeNames.map(name => [name, name]),
  ];
  assert.equal(schemes.length, 35);
  for (const [scheme, referenceName] of schemes) {
    await page.locator('#swatches').evaluate((element, value) => {
      element.setAttribute('data-md-scheme', value);
    }, scheme);
    const expectedColors = material3ColorValues(scheme);
    const observed = await page.locator('.swatch').evaluateAll(elements =>
      elements.map(element => ({
        role: element.dataset.role,
        color: getComputedStyle(element).backgroundColor,
      })),
    );
    for (const item of observed)
      assert.equal(item.color, hexRgb(expectedColors[item.role]), `${scheme} ${item.role}`);
    const actual = PNG.sync.read(await page.locator('#swatches').screenshot());
    const referenceFile = manifest.files[referenceName]?.file;
    assert.ok(referenceFile, `Missing pinned reference for ${scheme}`);
    const reference = PNG.sync.read(
      await fs.readFile(path.join(referenceRoot, referenceFile)),
    );
    assert.equal(actual.width, reference.width);
    assert.equal(actual.height, reference.height);
    const changed = pixelmatch(
      actual.data,
      reference.data,
      null,
      reference.width,
      reference.height,
      {threshold: 0, includeAA: true},
    );
    assert.equal(changed, 0, `${scheme} differs from pinned source pixels`);
  }
  await page.locator('#swatches').evaluate(element => {
    element.setAttribute('data-md-scheme', 'dark');
    element.style.setProperty('--md-sys-color-primary', '#123456');
  });
  assert.equal(
    await page.locator('[data-role="primary"]').evaluate(element =>
      getComputedStyle(element).backgroundColor,
    ),
    'rgb(18, 52, 86)',
  );
  const typeRoot = path.join(packageRoot, 'fixtures/references/typography');
  const typeManifest = JSON.parse(await fs.readFile(path.join(typeRoot, 'manifest.json'), 'utf8'));
  const font = await fs.readFile(path.resolve(packageRoot, '../themes/material3/scripts/fonts/Roboto-wdth-wght.ttf'));
  assert.equal(createHash('sha256').update(font).digest('hex'), typeManifest.font.sha256);
  const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;
  const toRole = role => role.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  for (const mode of ['light', 'dark']) {
    const values = material3TokenValues(mode);
    await page.setViewportSize(typeManifest.viewport);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
      @font-face {font-family: PinnedRoboto; src: url('${fontUrl}') format('truetype'); font-weight: 100 900; font-style: normal}
      * {box-sizing: border-box} html, body {margin: 0; padding: 0}
      body {background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); width: 1280px; font-synthesis: none}
      main {display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; padding: 32px}
      article {min-height: 112px; border-bottom: 1px solid currentColor; padding: 12px 0; overflow: hidden}
      small {display: block; font: 12px/20px Arial, sans-serif; opacity: .7}
      .sample {white-space: nowrap; font-family: PinnedRoboto, sans-serif; font-synthesis: none}
    </style></head><body data-md-scheme="${mode}"><main></main></body></html>`);
    const observed = await page.evaluate(async entries => {
      const root = document.querySelector('main');
      for (const item of entries) {
        const article = document.createElement('article');
        const label = document.createElement('small');
        label.textContent = item.role;
        const sample = document.createElement('div');
        sample.className = 'sample';
        sample.textContent = 'Aa 0123456789';
        sample.style.fontSize = item.fontSize;
        sample.style.lineHeight = item.lineHeight;
        sample.style.letterSpacing = `${item.letterSpacingPx}px`;
        sample.style.fontWeight = item.fontWeight;
        article.append(label, sample);
        root.append(article);
      }
      await document.fonts.ready;
      return [...document.querySelectorAll('.sample')].map(node => {
        const style = getComputedStyle(node);
        return {
          loaded: document.fonts.check(`${style.fontWeight} ${style.fontSize} PinnedRoboto`),
          fits: node.scrollWidth <= node.clientWidth,
          fontSizePx: Number.parseFloat(style.fontSize),
          lineHeightPx: Number.parseFloat(style.lineHeight),
          letterSpacingPx: style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing),
          fontWeight: Number(style.fontWeight),
        };
      });
    }, typeManifest.styles.map(item => {
      const role = toRole(item.role).replace('-emphasized', '');
      const style = material3TypeStyles[toRole(item.role)];
      assert.ok(style, item.role);
      assert.deepEqual(style, {
        fontSizePx: item.fontSizePx,
        lineHeightPx: item.lineHeightPx,
        letterSpacingPx: item.letterSpacingPx,
        fontWeight: item.fontWeight,
      });
      const standard = !item.role.endsWith('Emphasized');
      const prefix = `--md-sys-typescale-${role}`;
      if (standard) {
        assert.equal(values[`${prefix}-size`], `${item.fontSizePx / 16}rem`);
        assert.equal(values[`${prefix}-line-height`], `${item.lineHeightPx / 16}rem`);
        assert.equal(values[`${prefix}-weight`], String(item.fontWeight));
      }
      return {
        ...item,
        fontSize: standard ? `var(${prefix}-size)` : `${style.fontSizePx}px`,
        lineHeight: standard ? `var(${prefix}-line-height)` : `${style.lineHeightPx}px`,
        fontWeight: standard ? `var(${prefix}-weight)` : String(style.fontWeight),
      };
    }));
    observed.forEach((actual, index) => {
      const expected = typeManifest.styles[index];
      assert.ok(actual.loaded && actual.fits, `${mode} ${expected.role} font did not load or fit`);
      for (const key of ['fontSizePx', 'lineHeightPx', 'letterSpacingPx', 'fontWeight'])
        assert.ok(Math.abs(actual[key] - expected[key]) < .001, `${mode} ${expected.role} ${key}: ${actual[key]}`);
    });
    const actual = PNG.sync.read(await page.screenshot({fullPage: true}));
    const reference = PNG.sync.read(await fs.readFile(path.join(typeRoot, typeManifest.files[mode].file)));
    assert.equal(actual.width, reference.width);
    assert.equal(actual.height, reference.height);
    const changed = pixelmatch(actual.data, reference.data, null, reference.width, reference.height, {threshold: 0, includeAA: true});
    assert.equal(changed, 0, `${mode} typography differs from pinned source pixels`);
  }
  console.log(
    `Chrome ${browser.version()}: 35 schemes × 49 roles and 30 type styles × 2 modes match pinned source pixels; scoped override passes.`,
  );
} finally {
  await browser.close();
}
