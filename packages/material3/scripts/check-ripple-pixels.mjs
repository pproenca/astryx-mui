// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose source frames, licensed font, native Ripple gallery and pinned Chrome. @output Source-matched native pixel comparison. @position Permanent Ripple visual regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gallery = path.join(packageRoot, 'dist/gallery');
const source = path.join(packageRoot, 'fixtures/references/ripple');
const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json')));
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(gallery, `.${pathname}`);
    if (!file.startsWith(gallery + path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'chrome', headless: true, executablePath: process.env.M3_BROWSER_EXECUTABLE});
try {
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({viewport: {width: 960, height: 360}, deviceScaleFactor: 1});
    await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple-compare.html?scheme=${scheme}`);
    await page.waitForFunction(() => [...document.querySelectorAll('[data-md-ripple-ready]')].length === 2);
    await page.evaluate(() => document.fonts.ready);
    for (const timeMs of [0, 20, 75, 120]) {
      await page.evaluate(timeMs => {
        document.getElementById('stage').textContent = `Press 0ms · release 50ms · press 160ms · press 300ms · release 400ms · ${timeMs}ms`;
        for (const id of ['bounded', 'unbounded']) {
          const owner = document.getElementById(id);
          const rect = owner.getBoundingClientRect();
          if (!owner.dataset.started) {
            owner.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerId: 1, clientX: rect.left + 40, clientY: rect.top + 30}));
            owner.dataset.started = 'true';
          }
        }
        for (const animation of document.getAnimations()) {
          animation.pause();
          animation.currentTime = timeMs;
        }
      }, timeMs);
      const actual = PNG.sync.read(await page.screenshot());
      const name = `ripple-${scheme}-${String(timeMs).padStart(4, '0')}.png`;
      const bytes = await fs.readFile(path.join(source, name));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.frames[name]);
      const expected = PNG.sync.read(bytes);
      assert.equal(actual.width, expected.width);
      assert.equal(actual.height, expected.height);
      const differences = pixelmatch(actual.data, expected.data, null, actual.width, actual.height, {threshold: 0});
      assert.ok(differences <= manifest.maxChangedPixels, `${name}: ${differences} changed pixels`);
      process.stdout.write(`${scheme} ${timeMs}ms: ${differences} changed pixels\n`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
