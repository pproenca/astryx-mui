// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Icon source capture template, licensed local font cache, and built native glyphs. @output Independent light/dark native captures and pixel differences. @position Disposable M3-NAT-003 visual comparison. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {pixels} from '../compare.mjs';
import {Icon} from '../../../packages/material3/dist/Icon/Icon.js';
import {MaterialSymbol} from '../../../packages/material3/dist/MaterialSymbol/MaterialSymbol.js';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const actualRoot = path.join(
  root,
  'internal/material3-migration/actual/M3-NAT-003',
);
const sourceRoot = path.join(
  root,
  'internal/material3-migration/sources/icon-reference',
);
const source = JSON.parse(
  await fs.readFile(path.join(sourceRoot, 'manifest.json')),
);
const iconSource = JSON.parse(
  await fs.readFile(
    path.join(root, 'packages/themes/material3/src/material3IconSource.json'),
  ),
);
const generator = await fs.readFile(
  path.join(sourceRoot, 'generate-icon-reference.mjs'),
  'utf8',
);
const htmlTemplate = /const html = `([\s\S]*?)`;/u.exec(generator)?.[1];
assert.ok(htmlTemplate, 'Pinned source layout is missing');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fontCache =
  process.env.M3_ICON_FONT_CACHE || '/private/tmp/astryx-material3-font-cache';
const fonts = {};
for (const [name, expected] of Object.entries(source.fontPins)) {
  const bytes = await fs.readFile(
    path.join(fontCache, `MaterialSymbols${name}.woff2`),
  );
  assert.equal(sha(bytes), expected, `${name} font changed`);
  fonts[name] = `data:font/woff2;base64,${bytes.toString('base64')}`;
}
const css = await fs.readFile(
  path.join(root, 'packages/material3/dist/components.css'),
  'utf8',
);
const glyphs = source.cases.light.glyphs;
const h = React.createElement;
const Svg = name => props =>
  h(
    'svg',
    {...props, viewBox: iconSource.artwork[name].viewBox, fill: 'currentColor'},
    h('path', {d: iconSource.artwork[name].paths[0]}),
  );
const symbols = name =>
  glyphs.map(glyph =>
    h(
      'div',
      {className: 'sample', key: glyph},
      h(MaterialSymbol, {
        name: glyph,
        variant: name.toLowerCase(),
        fill: 0,
        weight: 400,
        grade: 0,
        opticalSize: 24,
        className: `font ${name}`,
      }),
      h('small', null, glyph),
    ),
  );
const families = Object.keys(source.fontPins)
  .map(
    name =>
      `<div class="card"><div class="name">Material Symbols ${name}</div><div class="symbols">${renderToStaticMarkup(h(React.Fragment, null, ...symbols(name)))}</div><div class="caption">FILL 0 · wght 400 · GRAD 0 · opsz 24</div></div>`,
  )
  .join('');
const svgs = renderToStaticMarkup(
  h(
    React.Fragment,
    null,
    ...glyphs.map(name =>
      h(
        'div',
        {className: 'sample', key: name},
        h(Icon, {icon: Svg(name), className: 'svg'}),
        h('small', null, name),
      ),
    ),
  ),
);
const button = renderToStaticMarkup(
  h(MaterialSymbol, {
    name: 'check',
    size: 20,
    fill: 0,
    weight: 400,
    grade: 0,
    opticalSize: 20,
    className: 'font Outlined',
  }),
);
const check = process.argv.includes('--check');
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['Light', 'Dark']) {
    const id = mode.toLowerCase();
    const theme = source.cases[id].theme;
    const values = {
      families,
      svgs,
      mode,
      'fontUrls.Outlined': fonts.Outlined,
      'fontUrls.Rounded': fonts.Rounded,
      'fontUrls.Sharp': fonts.Sharp,
      'theme.surface': theme.surface,
      'theme.surfaceContainerLow': theme.surfaceContainerLow,
      'theme.primary': theme.primary,
      'theme.onPrimary': theme.onPrimary,
      'theme.onSurface': theme.onSurface,
    };
    let html = htmlTemplate.replace(/\$\{([^}]+)\}/gu, (_all, key) => {
      assert.ok(
        Object.hasOwn(values, key),
        `Unknown source layout field ${key}`,
      );
      return values[key];
    });
    html = html.replace('<style>', `<style>${css}</style><style>`);
    html = html.replace(
      '<span class="font Outlined" aria-hidden="true">check</span>',
      button,
    );
    const page = await browser.newPage({
      viewport: source.viewport,
      deviceScaleFactor: source.dpr,
    });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    for (const family of Object.keys(source.fontPins))
      assert.ok(
        await page.evaluate(
          name => document.fonts.check(`24px ${name}`),
          family,
        ),
        `${family} font did not load`,
      );
    const bytes = await page.screenshot();
    const baseline = PNG.sync.read(
      await fs.readFile(path.join(sourceRoot, `icons-${id}.png`)),
    );
    const actual = PNG.sync.read(bytes);
    assert.equal(actual.width, baseline.width);
    assert.equal(actual.height, baseline.height);
    const diff = pixels(baseline, actual);
    const changed = diff.changedPixels;
    if (check) {
      assert.ok(
        (await fs.readFile(path.join(actualRoot, `icons-${id}.png`))).equals(
          bytes,
        ),
        `${id} capture changed`,
      );
      assert.ok(
        (
          await fs.readFile(path.join(actualRoot, `diff/icons-${id}.png`))
        ).equals(PNG.sync.write(diff)),
        `${id} diff changed`,
      );
    } else {
      await fs.mkdir(path.join(actualRoot, 'diff'), {recursive: true});
      await fs.writeFile(path.join(actualRoot, `icons-${id}.png`), bytes);
      await fs.writeFile(
        path.join(actualRoot, `diff/icons-${id}.png`),
        PNG.sync.write(diff),
      );
    }
    console.log(`${id}: ${changed} changed pixels`);
    await page.close();
  }
} finally {
  await browser.close();
}
