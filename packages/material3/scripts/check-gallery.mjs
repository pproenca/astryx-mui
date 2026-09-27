// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Optional M3_BROWSER_EXECUTABLE for the pinned browser; Built native gallery, product-owned pinned comparisons, and Chrome. @output Provenance, asset, responsive and interactive gallery regression. @position Permanent native foundation gallery check. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gallery = path.join(root, 'dist/gallery');
const evidence = path.join(gallery, 'evidence');
const manifest = JSON.parse(
  await fs.readFile(path.join(evidence, 'manifest.json')),
);
assert.equal(manifest.scenarios.length, 18);
assert.equal(new Set(manifest.scenarios.map(item => item.dimension)).size, 8);
for (const scenario of manifest.scenarios) {
  assert.equal(scenario.changedPixels, 0, scenario.id);
  for (const kind of ['source', 'native', 'diff']) {
    const bytes = await fs.readFile(path.join(evidence, scenario.files[kind]));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      scenario.sha256[kind],
    );
  }
}
for (const name of [
  'compose-default-spatial.mp4',
  'native-motion.webm',
  'Roboto-wdth-wght.ttf',
  'OFL.txt',
])
  assert.ok((await fs.stat(path.join(evidence, name))).size > 100);

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    const file = path.resolve(gallery, `.${pathname}`);
    if (!file.startsWith(gallery + path.sep))
      throw new Error('Outside gallery');
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
  const page = await browser.newPage({viewport: {width: 1180, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.locator('.comparison').first().waitFor();
  assert.equal(await page.locator('.comparison').count(), 18);
  assert.equal(await page.locator('details').count(), 8);
  assert.match(
    await page.locator('#revision').textContent(),
    /Current native build: [0-9a-f]{40}/,
  );
  assert.equal(
    await page.locator('iframe#native-frame').getAttribute('title'),
    'Interactive native Material 3 foundation preview',
  );
  assert.equal(
    await page.locator('iframe#focus-ring-frame').getAttribute('title'),
    'Interactive native Material 3 FocusRing preview',
  );
  const focusRingFixture = page.frameLocator('#focus-ring-frame');
  await focusRingFixture.getByTestId('inset-ring').waitFor();
  const fixture = page.frameLocator('#native-frame');
  await fixture.locator('#flower').waitFor();
  await page.locator('#scheme').selectOption('dark');
  await page.waitForFunction(
    () =>
      document.querySelector('#native-frame')?.contentDocument?.body?.dataset
        .mdScheme === 'dark',
  );
  await fixture.locator('#primary-swatch').waitFor();
  assert.equal(await fixture.locator('#scheme').inputValue(), 'dark');
  assert.equal(
    await fixture
      .locator('#primary-swatch')
      .evaluate(node => getComputedStyle(node).backgroundColor),
    'rgb(208, 188, 255)',
  );
  await page.locator('#direction').click();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.waitForFunction(
    () =>
      document.querySelector('#native-frame')?.contentDocument?.documentElement
        ?.dir === 'rtl',
  );
  assert.equal(
    await fixture.locator('#direction').getAttribute('aria-pressed'),
    'true',
  );
  await page.locator('#scheme').selectOption('expressive-light');
  await page.waitForFunction(
    () =>
      document.querySelector('#native-frame')?.contentDocument?.body?.dataset
        .mdScheme === 'expressive-light',
  );
  assert.equal(
    await fixture.locator('#scheme').inputValue(),
    'expressive-light',
  );
  await page.setViewportSize({width: 390, height: 844});
  assert.ok(await page.locator('#native-frame').isVisible());
  assert.ok(await page.locator('#focus-ring-frame').isVisible());
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    'Gallery overflows narrow viewport',
  );
  await fixture.locator('#override').focus();
  await page.keyboard.press('Enter');
  assert.equal(
    await fixture.locator('#override').getAttribute('aria-pressed'),
    'true',
  );
  await fixture.locator('#reduced').check();
  await fixture.locator('#enter').click();
  assert.match(
    await fixture.locator('#motion-measure').textContent(),
    /Position 100\.00px · velocity 0\.00px\/s/,
  );
  assert.deepEqual(errors, []);
  console.log(
    `Chrome ${browser.version()}: gallery provenance, assets, scheme, RTL, keyboard, reduced motion and narrow layout pass.`,
  );
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
