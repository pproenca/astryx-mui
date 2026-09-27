// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native focus comparison fixture and pinned Compose focus frames. @output Matched light/dark native inset target pixel differences. @position Permanent native FocusRing source pixel regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const root = path.join(packageRoot, 'dist/gallery');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside gallery');
    response.setHeader(
      'Content-Type',
      mime[path.extname(file)] || 'application/octet-stream',
    );
    const bytes = await fs.readFile(file);
    response.end(
      path.basename(file) === 'focus-ring-outward-compare.html' &&
        new URL(request.url, 'http://localhost').searchParams.get('mode') ===
          'dark'
        ? bytes
            .toString()
            .replace('data-md-scheme="light"', 'data-md-scheme="dark"')
        : bytes,
    );
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
async function compare(referenceFile, nativeBytes, x, y, width, height, label) {
  const source = PNG.sync.read(
    await fs.readFile(
      path.join(packageRoot, 'fixtures/references/focus', referenceFile),
    ),
  );
  const native = PNG.sync.read(nativeBytes);
  assert.deepEqual([native.width, native.height], [width, height]);
  const reference = new PNG({width, height});
  PNG.bitblt(source, reference, x, y, width, height, 0, 0);
  const diff = new PNG({width, height});
  const changed = pixelmatch(
    reference.data,
    native.data,
    diff.data,
    width,
    height,
    {threshold: 0, includeAA: true},
  );
  console.log(`${label}: ${changed} / ${width * height} changed pixels`);
  if (changed) {
    await fs.writeFile(
      path.join(os.tmpdir(), `astryx-focus-${label.replaceAll(' ', '-')}-native.png`),
      PNG.sync.write(native),
    );
    await fs.writeFile(
      path.join(os.tmpdir(), `astryx-focus-${label.replaceAll(' ', '-')}-diff.png`),
      PNG.sync.write(diff),
    );
  }
  assert.equal(changed, 0, `${label} must match pinned source pixels exactly`);
}
async function pageCrop(page, clip) {
  const full = PNG.sync.read(await page.screenshot());
  const cropped = new PNG({width: clip.width, height: clip.height});
  PNG.bitblt(full, cropped, clip.x, clip.y, clip.width, clip.height, 0, 0);
  return PNG.sync.write(cropped);
}
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await page.clock.install({time: new Date('2026-09-27T00:00:00Z')});
    await page.goto(
      `http://127.0.0.1:${server.address().port}/fixtures/focus-ring-compare.html`,
    );
    await page.locator('#standard-target span').waitFor();
    await page.locator('#expressive-target span').waitFor();
    await page.locator('body').evaluate((body, value) => {
      body.dataset.mdScheme = value;
      document.querySelector('h1').textContent =
        `Compose focus indication · ${value === 'light' ? 'Light' : 'Dark'}`;
      const expressive = document.querySelector('#expressive-target');
      for (const token of [
        '--md-sys-color-secondary',
        '--md-sys-color-on-secondary',
        '--md-sys-color-surface-container-low',
      ])
        expressive.style.setProperty(
          token,
          getComputedStyle(body).getPropertyValue(token),
        );
    }, mode);
    await page.evaluate(() => document.fonts.ready);
    await page.clock.pauseAt(new Date('2026-09-27T00:01:00Z'));
    await page.keyboard.press('Tab');
    for (let timeMs = 20; timeMs <= 260; timeMs += 20) {
      await page.clock.fastForward(20);
      if (timeMs === 120)
        await page.locator('#driver').evaluate(node => node.blur());
      if (timeMs === 160)
        await page.locator('#driver').evaluate(node => node.focus());
    }
    for (const [id, x] of [
      ['standard', 359],
      ['expressive', 657],
    ]) {
      await compare(
        `focus-${mode}-0260.png`,
        await page.locator(`#${id}-target`).screenshot(),
        x,
        103,
        220,
        92,
        `${mode} ${id}`,
      );
    }
    await page.close();
    const outward = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await outward.goto(
      `http://127.0.0.1:${server.address().port}/fixtures/focus-ring-outward-compare.html?mode=${mode}`,
    );
    await outward.locator('#outward-target span').waitFor({state: 'attached'});
    await outward.evaluate(() => document.fonts.ready);
    await outward.keyboard.press('Tab');
    await outward.waitForTimeout(700);
    const clip = {x: 80, y: 100, width: 248, height: 108};
    await compare(
      `web-outward-${mode}-rest.png`,
      await pageCrop(outward, clip),
      clip.x,
      clip.y,
      clip.width,
      clip.height,
      `${mode} outward rest`,
    );
    await outward.keyboard.press('Shift+Tab');
    await outward.keyboard.press('Tab');
    await outward.locator('#outward-target span').evaluate(node => {
      const animation = node.getAnimations()[0];
      animation.pause();
      animation.currentTime = 150;
      animation.commitStyles();
      animation.cancel();
      node.style.animationName = 'none';
    });
    assert.equal(
      await outward
        .locator('#outward-target > *')
        .evaluate(node => getComputedStyle(node).outlineWidth),
      '8px',
    );
    await compare(
      `web-outward-${mode}-active.png`,
      await pageCrop(outward, clip),
      clip.x,
      clip.y,
      clip.width,
      clip.height,
      `${mode} outward active`,
    );
    await outward.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
