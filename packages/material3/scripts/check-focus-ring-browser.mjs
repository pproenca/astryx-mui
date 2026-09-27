// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native FocusRing gallery fixture and Chrome. @output Browser modality, geometry, proxy, theme and reduced-motion assertions after effect attachment and settled focus paint. @position Permanent native FocusRing interaction regression. */
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
    await page.waitForFunction(
      testId =>
        document.querySelector(`[data-testid="${testId}"]`)?.getAttribute(
          'data-md-focus-ready',
        ) === 'true',
      await ring.getAttribute('data-testid'),
    );
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
  assert.equal(
    await inset.evaluate(node => getComputedStyle(node, '::before').borderTopColor),
    'rgb(98, 91, 113)',
    'Default outer stroke consumes Material Secondary',
  );
  await insetOwner.evaluate(node => {
    node.style.setProperty('--md-sys-color-secondary', 'rgb(255 0 0)');
    node.style.setProperty('--md-sys-color-on-secondary', 'rgb(0 128 0)');
  });
  assert.deepEqual(
    await inset.evaluate(node => [
      getComputedStyle(node, '::before').borderTopColor,
      getComputedStyle(node, '::after').borderTopColor,
    ]),
    ['rgb(255, 0, 0)', 'rgb(0, 128, 0)'],
    'Scoped Material role overrides select both Compose inset strokes',
  );
  await insetOwner.evaluate(node => {
    node.style.removeProperty('--md-sys-color-secondary');
    node.style.removeProperty('--md-sys-color-on-secondary');
  });
  assert.deepEqual(await insetOwner.boundingBox(), ownerBox);
  await insetOwner.dispatchEvent('pointerdown');
  assert.equal(
    await inset.evaluate(
      node => getComputedStyle(node, '::before').borderTopWidth,
    ),
    '0px',
  );
  for (const pointerType of ['touch', 'pen']) {
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await inset.evaluate(async node => {
      const deadline = performance.now() + 3000;
      let steadySince = 0;
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame);
        const now = performance.now();
        if (getComputedStyle(node, '::before').borderTopWidth === '2px') {
          if (!steadySince) steadySince = now;
          if (now - steadySince >= 200) return;
        } else {
          steadySince = 0;
        }
      }
      throw new Error('Keyboard focus ring did not settle at 2px');
    });
    assert.equal(
      await inset.evaluate(node => getComputedStyle(node, '::before').borderTopWidth),
      '2px',
      `Keyboard return restores focus after ${pointerType}`,
    );
    await insetOwner.evaluate((node, type) => {
      node.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerType: type}));
    }, pointerType);
    assert.equal(
      await inset.evaluate(node => getComputedStyle(node, '::before').borderTopWidth),
      '0px',
      `${pointerType} pointer input suppresses focus paint`,
    );
  }
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
  await page.locator('#proxy-owner').evaluate(node => {
    node.tabIndex = 0;
    node.focus();
  });
  assert.equal(await proxy.evaluate(node => getComputedStyle(node, '::before').borderTopWidth), '0px', 'Missing explicit ref must not fall back to the visual owner');
  await page.locator('#proxy-toggle').check();
  for (let index = 0; index < 5; index++) {
    if (await page.locator('#proxy-input').evaluate(node => document.activeElement === node)) break;
    await page.keyboard.press('Tab');
  }
  assert.equal(await page.locator('#proxy-input').evaluate(node => document.activeElement === node), true, 'Restored semantic input joins focus order');
  await page.waitForFunction(() =>
    getComputedStyle(document.querySelector('[data-testid="proxy-ring"]'), '::before').borderTopWidth === '2px',
  );
  assert.equal(await proxy.evaluate(node => getComputedStyle(node, '::before').borderTopWidth), '2px', 'Reattached explicit ref paints the proxy owner');
  await page.locator('#proxy-input').evaluate(node => {node.blur(); node.focus();});
  assert.equal(await proxy.evaluate(node => getComputedStyle(node, '::before').borderTopWidth), '2px', 'Programmatic focus keeps keyboard modality');
  await page.locator('.proxy').click();
  assert.equal(await proxy.evaluate(node => getComputedStyle(node, '::before').borderTopWidth), '0px', 'Pointer focus suppresses the ring');
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
  await page.emulateMedia({forcedColors: 'none'});
  await page.setViewportSize({width: 320, height: 720});
  await page.locator('body').evaluate(node => {node.style.zoom = '2';});
  const [ownerRect, ringRect] = await insetOwner.evaluate(node => {
    const owner = node.getBoundingClientRect();
    const ring = node.querySelector('span').getBoundingClientRect();
    return [{x: owner.x, y: owner.y, width: owner.width, height: owner.height}, {x: ring.x, y: ring.y, width: ring.width, height: ring.height}];
  });
  assert.deepEqual(ringRect, ownerRect, 'Inset ring stays aligned at narrow RTL and 200% zoom');
  assert.deepEqual(errors, []);
  const invalid = await browser.newPage({viewport: {width: 900, height: 700}});
  const warnings = [];
  invalid.on('console', message => {if (message.type() === 'warning') warnings.push(message.text());});
  await invalid.goto(`http://127.0.0.1:${server.address().port}/fixtures/focus-ring.html?invalid`);
  await invalid.locator('#static-owner').focus();
  await invalid.waitForTimeout(100);
  assert.equal(await invalid.getByTestId('static-ring').evaluate(node => getComputedStyle(node, '::before').borderTopWidth), '0px');
  await invalid.locator('#clipped-owner').focus();
  assert.equal(await invalid.getByTestId('clipped-ring').evaluate(node => getComputedStyle(node).visibility), 'hidden');
  assert.equal(warnings.some(message => message.includes('must be positioned')), true);
  assert.equal(warnings.some(message => message.includes('unclipped')), true);
  await invalid.close();
  console.log(
    'Native FocusRing browser modalities, association and geometry passed',
  );
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}
