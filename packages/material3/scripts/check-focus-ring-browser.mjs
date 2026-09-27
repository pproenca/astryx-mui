// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native FocusRing gallery fixture and Chrome. @output Browser modality, geometry, proxy, theme and reduced-motion assertions. @position Permanent native FocusRing interaction regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist/gallery',
);
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
    response.end(await fs.readFile(file));
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
try {
  const page = await browser.newPage({
    viewport: {width: 1100, height: 900},
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(
    `http://127.0.0.1:${server.address().port}/fixtures/focus-ring.html`,
  );
  await page
    .getByRole('heading', {name: 'Native Material 3 FocusRing'})
    .waitFor();
  const inset = page.getByTestId('inset-ring');
  const outward = page.getByTestId('outward-ring');
  const proxy = page.getByTestId('proxy-ring');
  for (const ring of [inset, outward, proxy]) {
    assert.equal(await ring.getAttribute('aria-hidden'), 'true');
    assert.equal(await ring.getAttribute('tabindex'), '-1');
    assert.equal(
      await ring.evaluate(node => getComputedStyle(node).pointerEvents),
      'none',
    );
  }
  const insetOwner = page.locator('#inset-owner');
  const ownerBox = await insetOwner.boundingBox();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(
    await insetOwner.evaluate(node => document.activeElement === node),
    true,
  );
  await page.waitForTimeout(100);
  const focusedBorder = await inset.evaluate(
    node => getComputedStyle(node, '::before').borderTopWidth,
  );
  assert.equal(focusedBorder, '2px');
  assert.deepEqual(await insetOwner.boundingBox(), ownerBox);
  await insetOwner.dispatchEvent('pointerdown');
  assert.equal(
    await inset.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '0px',
  );
  await page.keyboard.press('Tab');
  await page.waitForTimeout(30);
  assert.equal(
    await outward.evaluate(node => getComputedStyle(node).visibility),
    'visible',
  );
  assert.equal(
    await outward.evaluate(node => getComputedStyle(node).outlineColor),
    'rgb(98, 91, 113)',
  );
  await page.locator('#scheme').selectOption('dark');
  assert.equal(
    await outward.evaluate(node => getComputedStyle(node).visibility),
    'visible',
  );
  await page.locator('#direction').selectOption('rtl');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.locator('#disabled-toggle').check();
  assert.equal(await insetOwner.isDisabled(), true);
  await page.locator('.proxy').click();
  assert.equal(
    await proxy.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '0px',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(100);
  assert.equal(
    await proxy.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '2px',
  );
  await page.locator('#proxy-toggle').uncheck();
  assert.equal(
    await proxy.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '0px',
  );
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('#disabled-toggle').uncheck();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(
    await inset.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '2px',
  );
  await page.emulateMedia({forcedColors: 'active'});
  assert.notEqual(
    await inset.evaluate(
      node => getComputedStyle(node, '::before').borderTopColor,
    ),
    'rgba(0, 0, 0, 0)',
  );
  assert.deepEqual(errors, []);
  console.log(
    'Native FocusRing browser modalities, association and geometry passed',
  );
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
