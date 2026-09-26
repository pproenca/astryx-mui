// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose type/color tokens and licensed Roboto fixture. @output Reproducible light/dark browser type references and exact rendering conditions. @position Disposable foundation source fixture generator. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {hash} from '../workbook.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const compose = JSON.parse(
  await fs.readFile(path.join(here, 'compose-inventory.json')),
);
const policy = JSON.parse(await fs.readFile(path.join(here, '../policy.json')));
if (compose.commit !== policy.androidxCommit)
  throw new Error('Typography reference source pin differs from policy');

const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing pinned Compose token file: ${name}`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const typeScale = token('TypeScaleTokens');
const typeface = token('TypefaceTokens');
const paletteTokens = token('PaletteTokens');
const weights = {Normal: 400, Medium: 500, Bold: 700};
const roles = [...typeScale.keys()]
  .filter(name => name.endsWith('Size'))
  .map(name => name.slice(0, -'Size'.length))
  .sort();
if (roles.length !== 30) throw new Error('Expected 30 Compose type roles');
const styles = roles.map(role => {
  const number = metric => {
    const expression = typeScale.get(role + metric);
    if (!/^-?\d+(?:\.\d+)?\.sp$/.test(expression || ''))
      throw new Error(`Unresolved ${role}${metric}: ${expression}`);
    return Number(expression.slice(0, -3));
  };
  const weightToken = typeScale.get(role + 'Weight');
  const weight = typeface.get(weightToken?.replace(/^TypefaceTokens\./, ''));
  const fontWeight = weights[weight?.replace(/^FontWeight\./, '')];
  if (!fontWeight) throw new Error(`Unresolved ${role} weight: ${weightToken}`);
  return {
    role,
    fontSizePx: number('Size'),
    lineHeightPx: number('LineHeight'),
    letterSpacingPx: number('Tracking'),
    fontWeight,
  };
});

function schemeColor(mode, name) {
  const expressions = token(`Color${mode}Tokens`);
  function resolve(key) {
    const expression = expressions.get(key);
    if (!expression) throw new Error(`Unresolved ${mode} color: ${key}`);
    const palette = expression.replace(/^PaletteTokens\./, '');
    if (palette !== expression) {
      const color = paletteTokens.get(palette);
      const match = color?.match(
        /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
      );
      if (!match) throw new Error(`Unresolved palette color: ${palette}`);
      return `rgb(${match.slice(1).join(' ')})`;
    }
    return resolve(expression);
  }
  return resolve(name);
}

const fontRelative =
  'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf';
const font = await fs.readFile(path.join(repo, fontRelative));
const fontSha256 = hash(font);
if (
  fontSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('The pinned Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;
const out = path.join(here, 'typography-reference');
const browser = await chromium.launch({channel: 'chrome', headless: true});
const files = {};
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 1280, height: 720},
      deviceScaleFactor: 1,
    });
    const background = schemeColor(mode, 'Surface');
    const foreground = schemeColor(mode, 'OnSurface');
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face {font-family: PinnedRoboto; src: url('${fontUrl}') format('truetype'); font-weight: 100 900; font-style: normal}
      * {box-sizing: border-box} html, body {margin: 0; padding: 0}
      body {background: ${background}; color: ${foreground}; width: 1280px; font-synthesis: none}
      main {display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; padding: 32px}
      article {min-height: 112px; border-bottom: 1px solid currentColor; padding: 12px 0; overflow: hidden}
      small {display: block; font: 12px/20px Arial, sans-serif; opacity: .7}
      .sample {white-space: nowrap; font-family: PinnedRoboto, sans-serif; font-synthesis: none}
    </style></head><body><main></main></body></html>`);
    const observed = await page.evaluate(async entries => {
      const root = document.querySelector('main');
      for (const item of entries) {
        const article = document.createElement('article');
        const label = document.createElement('small');
        label.textContent = item.role;
        const sample = document.createElement('div');
        sample.className = 'sample';
        sample.textContent = 'Aa 0123456789';
        sample.style.fontSize = `${item.fontSizePx}px`;
        sample.style.lineHeight = `${item.lineHeightPx}px`;
        sample.style.letterSpacing = `${item.letterSpacingPx}px`;
        sample.style.fontWeight = String(item.fontWeight);
        article.append(label, sample);
        root.append(article);
      }
      await document.fonts.ready;
      return [...document.querySelectorAll('.sample')].map(node => {
        const css = getComputedStyle(node);
        return {
          loaded: document.fonts.check(
            `${css.fontWeight} ${css.fontSize} PinnedRoboto`,
          ),
          fits: node.scrollWidth <= node.clientWidth,
          fontSizePx: Number.parseFloat(css.fontSize),
          lineHeightPx: Number.parseFloat(css.lineHeight),
          letterSpacingPx:
            css.letterSpacing === 'normal'
              ? 0
              : Number.parseFloat(css.letterSpacing),
          fontWeight: Number(css.fontWeight),
        };
      });
    }, styles);
    for (const [index, expected] of styles.entries()) {
      const actual = observed[index];
      if (
        !actual.loaded ||
        !actual.fits ||
        ['fontSizePx', 'lineHeightPx', 'letterSpacingPx', 'fontWeight'].some(
          key => Math.abs(actual[key] - expected[key]) > 0.001,
        )
      )
        throw new Error(
          `Browser type metrics differ for ${expected.role}: ${JSON.stringify(actual)}`,
        );
    }
    const bytes = await page.screenshot({fullPage: true});
    const file = `typography-${mode.toLowerCase()}.png`;
    files[mode.toLowerCase()] = {
      file,
      sha256: hash(bytes),
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      background,
      foreground,
    };
    if (process.argv.includes('--check')) {
      if (hash(await fs.readFile(path.join(out, file))) !== hash(bytes))
        throw new Error(`Typography source reference changed: ${file}`);
    } else {
      await fs.mkdir(out, {recursive: true});
      await fs.writeFile(path.join(out, file), bytes);
    }
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: compose.commit,
    browser: `Chrome ${browser.version()}`,
    os: `${process.platform} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1280, height: 720},
    font: {file: fontRelative, sha256: fontSha256, loaded: true},
    content: 'Aa 0123456789',
    fontScale: 1,
    layout:
      'Two columns of 15 labeled role samples, sorted by Compose token name.',
    styles,
    files,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const file = path.join(out, 'manifest.json');
  if (process.argv.includes('--check')) {
    if ((await fs.readFile(file, 'utf8')) !== bytes)
      throw new Error('Typography source manifest changed');
  } else await fs.writeFile(file, bytes);
  console.log(
    JSON.stringify({roles: styles.length, files, browser: manifest.browser}),
  );
} finally {
  await browser.close();
}
