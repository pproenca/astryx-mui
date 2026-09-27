// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-divider-hairline-browser.mjs
 * @input Hydrated native Divider paint and Chrome device densities
 * @output One-device-pixel hairline with zero occupied extent at DPR 1 and 2
 * @position Permanent native Divider density regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = [
  await fs.readFile(path.join(root, 'dist/tokens.css'), 'utf8'),
  await fs.readFile(path.join(root, 'dist/components.css'), 'utf8'),
].join('\n');
const bundle = await build({
  stdin: {
    contents: `import React from 'react';
import {createRoot} from 'react-dom/client';
import {HorizontalDivider, VerticalDivider} from './dist/Divider/index.js';
createRoot(document.getElementById('root')).render(
  document.body.dataset.orientation === 'horizontal'
    ? <HorizontalDivider thickness="hairline" data-testid="rule" />
    : <VerticalDivider thickness="hairline" data-testid="rule" />
);`,
    resolveDir: root,
    sourcefile: 'divider-hairline-entry.tsx',
    loader: 'tsx',
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome123'],
  write: false,
});
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  for (const dpr of [1, 2]) {
    for (const orientation of ['horizontal', 'vertical']) {
      const page = await browser.newPage({
        viewport: {width: 480, height: 240},
        deviceScaleFactor: dpr,
      });
      try {
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}\n*{box-sizing:border-box}html,body{margin:0;width:480px;height:240px;background:#fff}main{position:absolute;left:40px;top:40px;width:400px;height:160px}</style></head><body data-orientation="${orientation}"><main id="root"></main></body></html>`;
        await page.setContent(html);
        await page.addScriptTag({content: bundle.outputFiles[0].text});
        const rule = page.getByTestId('rule');
        await rule.waitFor({state: 'attached'});
        await page.waitForFunction(expected => {
          const node = document.querySelector('[data-testid="rule"]');
          const matrix = new DOMMatrixReadOnly(
            getComputedStyle(node).transform,
          );
          return (
            (document.body.dataset.orientation === 'horizontal'
              ? matrix.m22
              : matrix.m11) ===
            1 / expected
          );
        }, dpr);
        const box = await rule.boundingBox();
        assert.equal(orientation === 'horizontal' ? box.height : box.width, 0);
        const png = PNG.sync.read(await page.screenshot());
        const samples = [];
        for (let offset = 0; offset < 5; offset++) {
          const x =
            orientation === 'horizontal' ? 200 * dpr : 40 * dpr + offset;
          const y =
            orientation === 'horizontal' ? 40 * dpr + offset : 100 * dpr;
          const p = (y * png.width + x) * 4;
          samples.push(
            [...png.data.subarray(p, p + 3)].some(channel => channel !== 255),
          );
        }
        assert.equal(
          samples.filter(Boolean).length,
          1,
          `${orientation} hairline paints ${samples.filter(Boolean).length} device pixels at DPR ${dpr}`,
        );
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
process.stdout.write(
  'Native Divider hairline occupies zero layout and paints one device pixel at DPR 1 and 2.\n',
);
