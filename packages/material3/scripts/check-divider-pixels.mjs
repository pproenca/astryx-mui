// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-divider-pixels.mjs
 * @input Built native Divider paint and pinned Compose/Web source projections
 * @output Matched Chrome pixel and occupied-geometry comparison for seven static cases
 * @position Permanent native Divider visual regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {HorizontalDivider, VerticalDivider} from '../dist/Divider/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const references = path.join(root, 'fixtures/references/divider');
const manifest = JSON.parse(
  await fs.readFile(path.join(references, 'manifest.json'), 'utf8'),
);
const tokens = await fs.readFile(path.join(root, 'dist/tokens.css'), 'utf8');
const components = await fs.readFile(
  path.join(root, 'dist/components.css'),
  'utf8',
);
const cases = [
  {name: 'horizontal-light', orientation: 'horizontal', scheme: 'light'},
  {name: 'horizontal-dark', orientation: 'horizontal', scheme: 'dark'},
  {name: 'vertical-light', orientation: 'vertical', scheme: 'light'},
  {
    name: 'custom-20-light',
    orientation: 'horizontal',
    scheme: 'light',
    thickness: 20,
  },
  {
    name: 'hairline-light',
    orientation: 'horizontal',
    scheme: 'light',
    thickness: 'hairline',
  },
  {
    name: 'inset-start-ltr',
    orientation: 'horizontal',
    scheme: 'light',
    inset: 'start',
    direction: 'ltr',
  },
  {
    name: 'inset-start-rtl',
    orientation: 'horizontal',
    scheme: 'light',
    inset: 'start',
    direction: 'rtl',
  },
];
const captureDirectory = process.env.M3_CAPTURE_DIR;
if (captureDirectory) await fs.mkdir(captureDirectory, {recursive: true});
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  assert.equal(`Chrome ${browser.version()}`, manifest.browser);
  for (const item of cases) {
    const props = {
      thickness: item.thickness,
      inset: item.inset,
      'data-testid': 'rule',
    };
    const markup = renderToStaticMarkup(
      createElement(
        item.orientation === 'horizontal' ? HorizontalDivider : VerticalDivider,
        props,
      ),
    );
    const page = await browser.newPage({
      viewport: manifest.viewport,
      deviceScaleFactor: manifest.dpr,
    });
    try {
      const html = `<!doctype html><html dir="${item.direction || 'ltr'}"><head><meta charset="utf-8"><style>${tokens}\n${components}\n*{box-sizing:border-box}html,body{margin:0;width:480px;height:240px}body{background:${item.scheme === 'light' ? '#fff' : '#000'}}main{position:absolute;left:40px;top:40px;width:400px;height:160px}</style></head><body data-md-scheme="${item.scheme}"><main>${markup}</main></body></html>`;
      await page.setContent(html);
      const box = await page.getByTestId('rule').boundingBox();
      assert.ok(box, `No Divider geometry for ${item.name}`);
      assert.deepEqual(
        {width: box.width, height: box.height},
        item.orientation === 'vertical'
          ? {width: 1, height: 160}
          : {
              width: item.inset ? 384 : 400,
              height: item.thickness === 'hairline' ? 0 : item.thickness || 1,
            },
        `Divider geometry differs for ${item.name}`,
      );
      const actualBytes = await page.screenshot();
      const expectedBytes = await fs.readFile(
        path.join(references, `${item.name}.png`),
      );
      if (captureDirectory)
        await fs.writeFile(
          path.join(captureDirectory, `${item.name}.png`),
          actualBytes,
        );
      const actual = PNG.sync.read(actualBytes);
      const expected = PNG.sync.read(expectedBytes);
      assert.equal(actual.width, expected.width);
      assert.equal(actual.height, expected.height);
      let changed = 0;
      for (let p = 0; p < actual.data.length; p += 4) {
        if (
          actual.data[p] !== expected.data[p] ||
          actual.data[p + 1] !== expected.data[p + 1] ||
          actual.data[p + 2] !== expected.data[p + 2] ||
          actual.data[p + 3] !== expected.data[p + 3]
        )
          changed++;
      }
      assert.equal(changed, 0, `${item.name}: ${changed} changed pixels`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.stdout.write(
  'Seven native Divider frames match pinned source pixels and geometry.\n',
);
