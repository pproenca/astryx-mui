// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-icons-browser.mjs
 * @input Pinned Material Symbols source and local Chrome
 * @output Glyph geometry checks and optional visual contact sheet
 * @position Focused browser check for Material 3 theme icon artwork
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(
  fs.readFileSync(
    path.resolve(directory, '../src/material3IconSource.json'),
    'utf8',
  ),
);
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({
    viewport: {width: 990, height: 650},
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html><head><style>
    body { margin: 0; padding: 20px; background: #fef7ff; color: #1d1b20;
      font: 13px Arial, sans-serif; }
    main { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
    article { background: #fff; border: 1px solid #cac4d0; border-radius: 12px;
      height: 100px; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 11px; }
    svg { width: 40px; height: 40px; fill: currentColor; }
  </style></head><body><main></main></body></html>`);
  const observed = await page.evaluate(artwork => {
    const main = document.querySelector('main');
    return Object.entries(artwork).map(([name, item]) => {
      const card = document.createElement('article');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', item.viewBox);
      svg.setAttribute('aria-hidden', 'true');
      for (const d of item.paths) {
        const glyph = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path',
        );
        glyph.setAttribute('d', d);
        svg.append(glyph);
      }
      const label = document.createElement('span');
      label.textContent = name;
      card.append(svg, label);
      main.append(card);
      const bounds = svg.getBBox();
      return {
        name,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fill: getComputedStyle(svg).fill,
      };
    });
  }, source.artwork);
  for (const item of observed) {
    if (
      item.width <= 0 ||
      item.height <= 0 ||
      item.x < 0 ||
      item.y < -960 ||
      item.x + item.width > 960 ||
      item.y + item.height > 0 ||
      item.fill !== 'rgb(29, 27, 32)'
    ) {
      throw new Error(
        `Invalid Material Symbol geometry or currentColor for ${item.name}: ${JSON.stringify(item)}`,
      );
    }
  }
  const screenshot = process.argv.indexOf('--screenshot');
  if (screenshot >= 0) {
    const output = process.argv[screenshot + 1];
    if (!output) throw new Error('--screenshot requires a path');
    await page.screenshot({path: output, fullPage: true});
    console.log(`Wrote ${output}`);
  }
  console.log(
    `Chrome ${browser.version()}: ${observed.length} Material Symbols render with nonempty in-grid geometry and currentColor.`,
  );
} finally {
  await browser.close();
}
