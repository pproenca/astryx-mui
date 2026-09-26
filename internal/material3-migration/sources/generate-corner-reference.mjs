// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose shape and color tokens. @output Reproducible light/dark corner-role browser references. @position Disposable foundation source fixture generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {hash} from '../workbook.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const compose = JSON.parse(
  await fs.readFile(path.join(here, 'compose-inventory.json')),
);
const figma = JSON.parse(
  await fs.readFile(path.join(here, 'figma-kit-inventory.json')),
);
const policy = JSON.parse(await fs.readFile(path.join(here, '../policy.json')));
if (
  compose.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256
)
  throw new Error('Corner reference source pin differs from policy');
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing pinned Compose token file: ${name}`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const shape = token('ShapeTokens');
const title = value => value[0].toUpperCase() + value.slice(1);
const kit = figma.variables.filter(item => item.collection === 'Shape');
if (kit.length !== 10) throw new Error('Expected ten kit corner roles');
const roles = kit
  .map(item => {
    const role = item.name
      .slice('Corner/'.length)
      .split('-')
      .map(title)
      .join('');
    const expression = shape.get('Corner' + role);
    if (expression === 'CircleShape')
      return {role, radius: 'full', width: 96, height: 96};
    if (expression === 'RectangleShape')
      return {role, radius: 0, width: 160, height: 96};
    const match = expression?.match(
      /^RoundedCornerShape\((\d+(?:\.\d+)?)\.dp\)$/,
    );
    if (!match) throw new Error(`Unresolved Compose corner: Corner${role}`);
    return {role, radius: Number(match[1]), width: 160, height: 96};
  })
  .sort(
    (a, b) =>
      (a.radius === 'full' ? Infinity : a.radius) -
      (b.radius === 'full' ? Infinity : b.radius),
  );
if (roles.length !== 10) throw new Error('Expected ten Compose corner roles');

function schemeColor(mode, name) {
  const expressions = token(`Color${mode}Tokens`);
  const palette = token('PaletteTokens');
  function resolve(key) {
    const expression = expressions.get(key);
    if (!expression) throw new Error(`Unresolved ${mode} color: ${key}`);
    if (expression.startsWith('PaletteTokens.')) {
      const color = palette.get(expression.slice('PaletteTokens.'.length));
      const match = color?.match(
        /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
      );
      if (!match) throw new Error(`Unresolved palette color: ${expression}`);
      return `rgb(${match.slice(1).join(' ')})`;
    }
    return resolve(expression);
  }
  return resolve(name);
}

const out = path.join(here, 'corner-reference');
const browser = await chromium.launch({channel: 'chrome', headless: true});
const files = {};
try {
  for (const mode of ['Light', 'Dark']) {
    const background = schemeColor(mode, 'Surface');
    const foreground = schemeColor(mode, 'OnSurface');
    const fill = schemeColor(mode, 'Primary');
    const page = await browser.newPage({
      viewport: {width: 1200, height: 480},
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      * {box-sizing: border-box} html, body {margin: 0; padding: 0}
      body {width: 1200px; background: ${background}; color: ${foreground}}
      main {display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; padding: 20px}
      article {height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center}
      small {font: 14px/24px Arial, sans-serif; margin-top: 12px}
      .sample {background: ${fill}}
    </style></head><body><main></main></body></html>`);
    const observed = await page.evaluate(entries => {
      const root = document.querySelector('main');
      for (const item of entries) {
        const article = document.createElement('article');
        const sample = document.createElement('div');
        sample.className = 'sample';
        sample.style.width = `${item.width}px`;
        sample.style.height = `${item.height}px`;
        sample.style.borderRadius =
          item.radius === 'full' ? '50%' : `${item.radius}px`;
        const label = document.createElement('small');
        label.textContent = `Corner ${item.role}`;
        article.append(sample, label);
        root.append(article);
      }
      return [...document.querySelectorAll('.sample')].map(node => ({
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
        borderRadius: getComputedStyle(node).borderTopLeftRadius,
      }));
    }, roles);
    for (const [index, item] of roles.entries()) {
      const actual = observed[index];
      if (
        actual.width !== item.width ||
        actual.height !== item.height ||
        actual.borderRadius !==
          (item.radius === 'full' ? '50%' : `${item.radius}px`)
      )
        throw new Error(`Browser corner geometry differs for ${item.role}`);
    }
    const bytes = await page.screenshot({fullPage: true});
    const file = `corners-${mode.toLowerCase()}.png`;
    files[mode.toLowerCase()] = {
      file,
      sha256: hash(bytes),
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      background,
      foreground,
      fill,
    };
    if (process.argv.includes('--check')) {
      if (hash(await fs.readFile(path.join(out, file))) !== hash(bytes))
        throw new Error(`Corner source reference changed: ${file}`);
    } else {
      await fs.mkdir(out, {recursive: true});
      await fs.writeFile(path.join(out, file), bytes);
    }
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: compose.commit,
    figmaSha256: figma.source.localExportSha256,
    browser: `Chrome ${browser.version()}`,
    os: `${process.platform} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1200, height: 480},
    roles,
    files,
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  const file = path.join(out, 'manifest.json');
  if (process.argv.includes('--check')) {
    if ((await fs.readFile(file, 'utf8')) !== bytes)
      throw new Error('Corner source manifest changed');
  } else await fs.writeFile(file, bytes);
  console.log(
    JSON.stringify({roles: roles.length, files, browser: manifest.browser}),
  );
} finally {
  await browser.close();
}
