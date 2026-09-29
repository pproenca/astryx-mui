// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-filled-field-browser.mjs
 * @input Built native gallery, Material token CSS, and a Chromium executable
 * @output Browser checks for field semantics, geometry, state, spring reversal, theme, RTL, and reduced motion
 * @position Permanent native FilledField browser regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gallery = path.join(root, 'dist/gallery');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
};
const server = http.createServer(async (request, response) => {
  try {
    const relative = `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`;
    const file = path.resolve(gallery, relative);
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
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
const url = `http://127.0.0.1:${server.address().port}/fixtures/filled-field.html`;
const page = await browser.newPage({
  viewport: {width: 960, height: 740},
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  if (response.status() >= 400)
    errors.push(`${response.status()} ${response.url()}`);
});
const labelTop = () =>
  page
    .locator('[data-md-field-label]')
    .evaluate(node => Number.parseFloat(getComputedStyle(node).top));
const indicatorWidth = () =>
  page
    .locator('[data-md-field-container]')
    .evaluate(node =>
      Number.parseFloat(getComputedStyle(node, '::after').height),
    );

try {
  await page.goto(url);
  await page.locator('[data-md-filled-field]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const input = page.getByRole('textbox', {name: 'Email address'});
  const shell = page.locator('[data-md-filled-field]');
  const container = page.locator('[data-md-field-container]');
  assert.equal(await page.locator('[data-md-filled-field] input').count(), 1);
  assert.equal(await shell.getAttribute('role'), null);
  assert.equal(await shell.getAttribute('tabindex'), null);
  assert.equal(await input.getAttribute('aria-describedby'), 'email-help');
  assert.equal(
    await container.evaluate(node => getComputedStyle(node).minHeight),
    '56px',
  );
  assert.equal(Math.round((await container.boundingBox()).width), 280);
  assert.equal(
    await input.evaluate(node => getComputedStyle(node).borderTopWidth),
    '0px',
  );
  assert.equal(await labelTop(), 16);
  assert.equal(await indicatorWidth(), 1);
  await page.evaluate(() => {
    document.body.style.setProperty(
      '--md-filled-field-container-color',
      '#123456',
    );
    document.body.style.setProperty(
      '--md-filled-field-active-indicator-height',
      '3px',
    );
  });
  assert.equal(
    await container.evaluate(node => getComputedStyle(node).backgroundColor),
    'rgb(18, 52, 86)',
  );
  assert.equal(await indicatorWidth(), 3);
  await page.evaluate(() => {
    document.body.style.removeProperty('--md-filled-field-container-color');
    document.body.style.removeProperty(
      '--md-filled-field-active-indicator-height',
    );
  });
  assert.equal(await indicatorWidth(), 1);

  const clockPage = await browser.newPage({
    viewport: {width: 960, height: 740},
    deviceScaleFactor: 1,
  });
  await clockPage.clock.install({time: new Date('2026-09-29T00:00:00Z')});
  await clockPage.goto(url);
  await clockPage.locator('#native-email').waitFor();
  await clockPage.clock.pauseAt(new Date('2026-09-29T00:01:00Z'));
  await clockPage.locator('#native-email').evaluate(node => node.focus());
  const focusFrames = [];
  for (let timeMs = 0; timeMs <= 440; timeMs += 20) {
    if (timeMs) await clockPage.clock.fastForward(20);
    focusFrames.push(
      await clockPage.locator('[data-md-field-container]').evaluate(node => {
        const indicator = getComputedStyle(node, '::after');
        return {
          containerHeight: node.getBoundingClientRect().height,
          indicatorHeight: Number.parseFloat(indicator.height),
          indicatorColor: indicator.backgroundColor,
        };
      }),
    );
  }
  await clockPage.close();
  assert.equal(focusFrames.length, 23);
  assert.ok(
    focusFrames.every(
      frame =>
        frame.containerHeight === 56 &&
        frame.indicatorHeight >= 1 &&
        frame.indicatorColor !== 'rgba(0, 0, 0, 0)',
    ),
    'The active indicator must stay visible without moving the field boundary',
  );
  await input.focus();
  assert.notEqual(await shell.getAttribute('data-md-field-focused'), null);
  await page.waitForTimeout(120);
  const focusedTop = await labelTop();
  assert.ok(focusedTop < 6, `Focus label is still at ${focusedTop}px`);
  await input.evaluate(node => node.blur());
  await page.waitForTimeout(40);
  const reversingTop = await labelTop();
  assert.ok(
    reversingTop > focusedTop,
    `Blur did not reverse label: ${focusedTop} -> ${reversingTop}`,
  );
  await input.focus();
  await page.waitForTimeout(120);
  assert.ok(
    (await labelTop()) < reversingTop,
    'Refocus did not reverse the running spring',
  );
  assert.ok(Math.abs((await indicatorWidth()) - 2) < 0.05);

  await input.fill('person@example.com');
  await input.evaluate(node => node.blur());
  await page.waitForTimeout(180);
  assert.equal(await shell.getAttribute('data-md-field-populated'), '');
  assert.ok(
    Math.abs((await labelTop()) - 3) < 0.1,
    'Populated label should stay floating after blur',
  );
  assert.equal(await input.inputValue(), 'person@example.com');
  await page.getByLabel('Error', {exact: true}).check();
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  assert.equal(await shell.getAttribute('data-md-field-error'), '');
  await page.getByLabel('Disabled', {exact: true}).check();
  assert.equal(await input.isDisabled(), true);
  assert.equal(await shell.getAttribute('data-md-field-disabled'), '');
  assert.equal(await shell.getAttribute('data-md-field-focused'), null);
  await page.getByLabel('Disabled', {exact: true}).uncheck();
  await page.getByLabel('Error', {exact: true}).uncheck();

  const lightContainer = await container.evaluate(
    node => getComputedStyle(node).backgroundColor,
  );
  await page.getByLabel('Scheme').selectOption('dark');
  const darkContainer = await container.evaluate(
    node => getComputedStyle(node).backgroundColor,
  );
  assert.notEqual(darkContainer, lightContainer);
  await page.getByLabel('Direction').selectOption('rtl');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.setViewportSize({width: 320, height: 740});
  assert.ok(
    await shell.evaluate(
      node => node.getBoundingClientRect().right <= innerWidth + 1,
    ),
  );
  await page.getByLabel('Scheme').selectOption('expressive-light');
  await input.fill('');
  await input.evaluate(node => node.blur());
  await page.waitForTimeout(300);
  const expressiveTop = await input.evaluate(
    node =>
      new Promise(resolve => {
        let minimum = Infinity;
        const start = performance.now();
        node.focus();
        const sample = () => {
          const label = node
            .closest('[data-md-filled-field]')
            .querySelector('[data-md-field-label]');
          minimum = Math.min(
            minimum,
            Number.parseFloat(getComputedStyle(label).top),
          );
          if (performance.now() - start < 240) requestAnimationFrame(sample);
          else resolve(minimum);
        };
        requestAnimationFrame(sample);
      }),
  );
  assert.ok(
    expressiveTop < 3,
    `Expressive spatial spring did not overshoot: minimum label top ${expressiveTop}px`,
  );

  await page.emulateMedia({reducedMotion: 'reduce'});
  await input.evaluate(node => node.blur());
  await page.waitForTimeout(30);
  assert.equal(await labelTop(), 16);
  await input.focus();
  await page.waitForTimeout(30);
  assert.equal(await labelTop(), 3);
  assert.equal(await indicatorWidth(), 2);

  const capture = process.env.M3_CAPTURE_DIR;
  if (capture) {
    await fs.mkdir(capture, {recursive: true});
    await page.screenshot({
      path: path.join(capture, 'filled-field-browser.png'),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    'FilledField browser semantics, geometry, state, interruption, theme, RTL and reduced motion pass.',
  );
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
