// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Divider source projections and built native public exports. @output Seven independent native captures and exact RGBA differences. @position Disposable M3-NAT-004 visual evidence capture. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {pixels} from '../compare.mjs';
import {
  HorizontalDivider,
  VerticalDivider,
} from '../../../packages/material3/dist/Divider/index.js';

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const source = JSON.parse(
  await fs.readFile(
    path.join(
      repo,
      'internal/material3-migration/sources/baseline/divider-compose-first.json',
    ),
  ),
);
const actualRoot = path.join(
  repo,
  'internal/material3-migration/actual/M3-NAT-004',
);
const tokens = await fs.readFile(
  path.join(repo, 'packages/material3/dist/tokens.css'),
  'utf8',
);
const components = await fs.readFile(
  path.join(repo, 'packages/material3/dist/components.css'),
  'utf8',
);
const check = process.argv.includes('--check');
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  for (const scenario of source.scenarios) {
    const id = scenario.id;
    const vertical = id.includes('vertical');
    const custom = id.includes('custom-20');
    const hairline = id.includes('hairline');
    const inset = id.includes('inset-start');
    const markup = renderToStaticMarkup(
      createElement(vertical ? VerticalDivider : HorizontalDivider, {
        thickness: custom ? 20 : hairline ? 'hairline' : undefined,
        inset: inset ? 'start' : undefined,
        'data-testid': 'rule',
      }),
    );
    const page = await browser.newPage({
      viewport: scenario.environment.viewport,
      deviceScaleFactor: scenario.environment.dpr,
    });
    try {
      const html = `<!doctype html><html dir="${scenario.environment.direction}"><head><meta charset="utf-8"><style>${tokens}\n${components}\n*{box-sizing:border-box}html,body{margin:0;width:480px;height:240px}body{background:${scenario.environment.theme === 'light' ? '#fff' : '#000'}}main{position:absolute;left:40px;top:40px;width:400px;height:160px}</style></head><body data-md-scheme="${scenario.environment.theme}"><main>${markup}</main></body></html>`;
      await page.setContent(html);
      const capture = await page.screenshot();
      const reference = PNG.sync.read(
        await fs.readFile(path.join(repo, scenario.baseline)),
      );
      const diff = pixels(reference, PNG.sync.read(capture));
      assert.equal(
        diff.changedPixels,
        0,
        `${id}: ${diff.changedPixels} changed pixels`,
      );
      const actualFile = path.join(actualRoot, `${id}.png`);
      const diffFile = path.join(actualRoot, 'diff', `${id}.png`);
      const diffBytes = PNG.sync.write(diff);
      if (check) {
        assert.ok(
          (await fs.readFile(actualFile)).equals(capture),
          `${id} actual changed`,
        );
        assert.ok(
          (await fs.readFile(diffFile)).equals(diffBytes),
          `${id} diff changed`,
        );
      } else {
        await fs.mkdir(path.dirname(diffFile), {recursive: true});
        await fs.writeFile(actualFile, capture);
        await fs.writeFile(diffFile, diffBytes);
      }
      console.log(`${id}: 0 changed pixels`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
