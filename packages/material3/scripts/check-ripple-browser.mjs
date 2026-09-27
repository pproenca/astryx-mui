// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Ripple gallery and Chrome. @output Browser ownership, geometry, interaction, interruption and accessibility regression. @position Permanent native Ripple browser check. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gallery = path.join(root, 'dist/gallery');
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(gallery, `.${pathname}`);
    if (!file.startsWith(gallery + path.sep)) throw new Error('Outside gallery');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({channel: 'chrome', headless: true, executablePath: process.env.M3_BROWSER_EXECUTABLE});
try {
  const page = await browser.newPage({viewport: {width: 980, height: 940}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`http://127.0.0.1:${server.address().port}/fixtures/ripple.html`);
  const bounded = page.locator('#bounded-owner');
  const ripple = page.getByTestId('bounded-ripple');
  await ripple.waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="bounded-ripple"]')?.dataset.mdRippleReady === 'true');
  assert.equal(await ripple.getAttribute('aria-hidden'), 'true');
  assert.equal(await ripple.getAttribute('tabindex'), '-1');
  assert.equal(await ripple.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
  assert.equal(await ripple.evaluate(node => getComputedStyle(node).overflow), 'hidden');
  const box = await bounded.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 32, box.y + 26);
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'hover');
  assert.equal(
    await ripple.evaluate(node => node.children[0].getAnimations()[0].effect.getTiming().duration),
    15,
  );
  await page.mouse.down();
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 1);
  const geometry = await ripple.evaluate(node => {
    const moving = node.children[1].children[0];
    const circle = moving.children[0];
    const animations = [moving.getAnimations()[0], ...circle.getAnimations()];
    return {width: node.parentElement.clientWidth, height: node.parentElement.clientHeight,
      circleWidth: circle.getBoundingClientRect().width,
      origin: [animations[0].effect.getKeyframes()[0].left, animations[0].effect.getKeyframes()[0].top],
      timings: animations.map(animation => animation.effect.getTiming().duration)};
  });
  assert.equal(geometry.width, 220);
  assert.equal(geometry.height, 92);
  assert.deepEqual(geometry.origin, ['32px', '26px']);
  assert.deepEqual(geometry.timings.sort((a,b) => a-b), [75, 225, 225]);
  assert.ok(Math.abs(geometry.circleWidth - 132) < 2);
  await page.mouse.up();
  await ripple.locator(':scope > span:nth-child(2) > span').waitFor({
    state: 'detached',
    timeout: 2000,
  });
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 0);
  assert.equal(await page.locator('#activation-count').textContent(), '1');

  await page.locator('#drag-toggle').check();
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'drag');
  const dragLayer = await ripple.evaluate(node => {
    const animation = node.children[0].getAnimations()[0];
    return animation.effect.getTiming().duration;
  });
  assert.equal(dragLayer, 45);
  await page.waitForFunction(() =>
    getComputedStyle(document.querySelector('[data-testid="bounded-ripple"] > span:first-child')).opacity === '0.16',
  );
  assert.equal(await ripple.evaluate(node => getComputedStyle(node.children[0]).opacity), '0.16');
  await page.locator('#disabled-toggle').check();
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'rest');
  await bounded.dispatchEvent('pointerdown', {pointerId: 8, clientX: box.x + 32, clientY: box.y + 26});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 0);
  await page.locator('#disabled-toggle').uncheck();
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'drag');
  await page.locator('#drag-toggle').uncheck();
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'rest');
  assert.equal(
    await ripple.evaluate(node => node.children[0].getAnimations()[0].effect.getTiming().duration),
    150,
  );

  await bounded.dispatchEvent('pointerdown', {pointerId: 9, clientX: box.x + 40, clientY: box.y + 30});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 1);
  await page.locator('body').dispatchEvent('pointercancel', {pointerId: 9});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 0);

  await bounded.dispatchEvent('pointerdown', {pointerId: 10, clientX: box.x + 40, clientY: box.y + 30});
  await page.waitForTimeout(50);
  await page.locator('body').dispatchEvent('pointerup', {pointerId: 10});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 1);
  assert.equal(await ripple.evaluate(node => getComputedStyle(node.children[1].children[0].children[0]).opacity), '0.1');
  await bounded.dispatchEvent('pointerdown', {pointerId: 11, clientX: box.x + 180, clientY: box.y + 62});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 2);
  await page.locator('body').dispatchEvent('pointerup', {pointerId: 10});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 2);
  await page.locator('body').dispatchEvent('pointercancel', {pointerId: 11});
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 0);

  const unbounded = page.getByTestId('unbounded-ripple');
  assert.equal(await unbounded.evaluate(node => getComputedStyle(node).overflow), 'visible');
  const unboundedBox = await page.locator('#unbounded-owner').boundingBox();
  await page.mouse.move(unboundedBox.x + 20, unboundedBox.y + 20);
  await page.mouse.down();
  assert.equal(await unbounded.locator(':scope > span:nth-child(2) > span').count(), 1);
  const origin = await unbounded.evaluate(node => {
    const frame = node.children[1].children[0].getAnimations()[0].effect.getKeyframes()[0];
    return [frame.left, frame.top];
  });
  assert.deepEqual(origin, ['110px', '46px']);
  await page.mouse.up();

  const proxy = page.getByTestId('proxy-ripple');
  await page.locator('#proxy-owner').click();
  assert.equal(await page.locator('#proxy-input').isChecked(), true);
  await proxy.locator(':scope > span:nth-child(2) > span').waitFor({
    state: 'detached',
    timeout: 2000,
  });
  const proxyBox = await page.locator('#proxy-owner').boundingBox();
  await page.locator('#proxy-input').dispatchEvent('pointerdown', {
    pointerId: 12,
    clientX: proxyBox.x + 20,
    clientY: proxyBox.y + 20,
  });
  assert.equal(await proxy.locator(':scope > span:nth-child(2) > span').count(), 1);
  await page.locator('#proxy-toggle').uncheck();
  await page.waitForTimeout(0);
  assert.equal(await proxy.locator(':scope > span:nth-child(2) > span').count(), 0);

  await page.locator('#proxy-toggle').focus();
  await page.keyboard.press('Tab');
  assert.equal(await bounded.evaluate(node => node === document.activeElement), true);
  assert.equal(await ripple.getAttribute('data-md-ripple-state'), 'focus');
  assert.equal(
    await ripple.evaluate(node => node.children[0].getAnimations()[0].effect.getTiming().duration),
    45,
  );
  await page.keyboard.down('Space');
  assert.equal(await ripple.locator(':scope > span:nth-child(2) > span').count(), 1);
  await page.keyboard.up('Space');
  assert.equal(await page.locator('#activation-count').textContent(), '3');
  await ripple.locator(':scope > span:nth-child(2) > span').waitFor({
    state: 'detached',
    timeout: 2000,
  });

  await page.locator('#direction').selectOption('rtl');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');

  await page.emulateMedia({reducedMotion: 'reduce'});
  const rtlBox = await bounded.boundingBox();
  await page.mouse.move(rtlBox.x + 36, rtlBox.y + 30);
  await page.mouse.down();
  const reduced = await ripple.evaluate(node => {
    const moving = node.children[1].children[0];
    return [moving.getAnimations()[0].effect.getTiming().duration,
      ...moving.children[0].getAnimations().map(animation => animation.effect.getTiming().duration)];
  });
  assert.deepEqual(reduced, [0, 0, 0]);
  await page.mouse.up();
  await page.emulateMedia({forcedColors: 'active'});
  await page.locator('#drag-toggle').check();
  await page.waitForTimeout(60);
  const forced = await ripple.evaluate(node => ({
    color: getComputedStyle(node.children[0]).backgroundColor,
    adjustment: getComputedStyle(node.children[0]).forcedColorAdjust,
  }));
  assert.equal(forced.adjustment, 'none');
  assert.notEqual(forced.color, 'rgba(0, 0, 0, 0)');
  assert.deepEqual(errors, []);
  await page.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
process.stdout.write('Native Ripple browser checks passed.\n');
