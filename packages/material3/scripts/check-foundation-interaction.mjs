// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native package and foundation fixture. @output Pointer, keyboard, scope, RTL, interruption, reversal and reduced-motion checks. @position Permanent native foundation interaction regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside package');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}/fixtures/foundation.html?revision=test`;
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1180, height: 800}});
  page.on('pageerror', error => console.error('Fixture page error:', error.message));
  page.on('console', message => {
    if (message.type() === 'error') console.error('Fixture console:', message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) console.error('Fixture HTTP:', response.status(), response.url());
  });
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.__foundationQA));
  assert.equal(await page.locator('#revision').textContent(), 'Revision: test');
  assert.ok((await page.locator('#flower').getAttribute('d')).startsWith('M '));
  assert.equal(await page.locator('#primary-swatch').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(103, 80, 164)');
  await page.locator('#scheme').selectOption('dark');
  assert.equal(await page.locator('#primary-swatch').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(208, 188, 255)');
  await page.locator('#override').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#override').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#primary-swatch').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(18, 52, 86)');
  await page.locator('#override').click();
  assert.equal(await page.locator('#primary-swatch').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(208, 188, 255)');
  await page.locator('#direction').click();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.setViewportSize({width: 390, height: 840});
  assert.ok(await page.locator('.motion-stage').isVisible());
  await page.locator('#enter').click();
  await page.waitForTimeout(120);
  const before = await page.evaluate(() => window.__foundationQA.frame);
  assert.ok(before.position > 0 && before.position < 120);
  await page.locator('#interrupt').click();
  const {before: interrupted, after: resumed} = await page.evaluate(() => window.__foundationQA.lastRetarget);
  assert.ok(Math.abs(interrupted.position - resumed.position) < 0.0002, 'Interrupted spring position jumped');
  assert.ok(Math.abs(interrupted.velocity - resumed.velocity) < 0.002, 'Interrupted spring velocity jumped');
  await page.locator('#reverse').click();
  await page.waitForTimeout(180);
  assert.ok((await page.evaluate(() => window.__foundationQA.frame.position)) < interrupted.position);
  await page.locator('#reduced').check();
  await page.locator('#enter').click();
  assert.deepEqual(await page.evaluate(() => ({...window.__foundationQA.frame, running: window.__foundationQA.running})), {position: 100, velocity: 0, running: false});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('#reduced').uncheck();
  await page.locator('#exit').click();
  assert.deepEqual(await page.evaluate(() => ({...window.__foundationQA.frame, running: window.__foundationQA.running})), {position: 0, velocity: 0, running: false});
  console.log(`Chrome ${browser.version()}: native fixture passes pointer, Enter, scoped colors, dark, narrow RTL, spring interruption/reversal and reduced motion.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
