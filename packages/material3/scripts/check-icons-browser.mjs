// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Icon gallery and optional pinned local font cache. @output Browser contract, accessibility, responsive and font-axis assertions. @position Permanent native Icon browser regression. */
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
function contrast(foreground, background) {
  const channels = value =>
    value
      .match(/[\d.]+/gu)
      .slice(0, 3)
      .map(Number)
      .map(channel => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
  const luminance = value =>
    channels(value).reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
  const pair = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
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
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1180, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(
    `http://127.0.0.1:${server.address().port}/fixtures/icons.html`,
  );
  await page.getByRole('heading', {name: 'Icon and Material Symbol'}).waitFor();
  const svg = page.getByTestId('svg-check');
  const font = page.getByTestId('font-check');
  const tokenDefault = page.getByTestId('svg-default');
  assert.equal(
    await tokenDefault.evaluate(node => getComputedStyle(node).width),
    '24px',
  );
  await page
    .getByTestId('default-scope')
    .evaluate(node => node.style.setProperty('--md-icon-size', '28px'));
  assert.equal(
    await tokenDefault.evaluate(node => getComputedStyle(node).width),
    '28px',
  );
  assert.deepEqual(
    await page
      .getByTestId('svg-intrinsic')
      .evaluate(node => [
        getComputedStyle(node).width,
        getComputedStyle(node).height,
      ]),
    ['35px', '83px'],
  );
  assert.equal(await svg.getAttribute('aria-hidden'), 'true');
  assert.equal(await font.getAttribute('aria-hidden'), 'true');
  assert.deepEqual(
    await svg.evaluate(node => [
      getComputedStyle(node).width,
      getComputedStyle(node).height,
    ]),
    ['24px', '24px'],
  );
  assert.equal(await svg.locator('svg').getAttribute('focusable'), 'false');
  assert.equal(
    await svg.evaluate(node => getComputedStyle(node).color),
    'rgb(29, 27, 32)',
  );
  assert.equal(
    await page
      .getByTestId('svg-primary')
      .evaluate(node => getComputedStyle(node).color),
    'rgb(255, 255, 255)',
  );
  const lightContrast = await svg.evaluate(node => [
    getComputedStyle(node).color,
    getComputedStyle(node.closest('.card')).backgroundColor,
  ]);
  assert.ok(contrast(...lightContrast) >= 4.5);
  const primaryContrast = await page
    .getByTestId('svg-primary')
    .evaluate(node => [
      getComputedStyle(node).color,
      getComputedStyle(node.closest('.card')).backgroundColor,
    ]);
  assert.ok(contrast(...primaryContrast) >= 4.5);
  assert.equal(await page.getByRole('button', {name: 'Confirm'}).count(), 1);
  await page.locator('#named').check();
  assert.equal(
    (await page.getByRole('img', {name: 'check'}).count()) > 0,
    true,
  );
  await page.locator('#size').selectOption('32');
  assert.deepEqual(
    await svg.evaluate(node => [
      getComputedStyle(node).width,
      getComputedStyle(node).height,
    ]),
    ['32px', '32px'],
  );
  await page.locator('#variant').selectOption('rounded');
  await page.locator('#fill').fill('1');
  await page.locator('#weight').fill('500');
  await page.locator('#grade').fill('25');
  await page.locator('#optical-size').fill('32');
  const style = await font.evaluate(node => getComputedStyle(node));
  assert.match(style.fontFamily, /Material Symbols Rounded/);
  assert.match(style.fontVariationSettings, /"FILL" 1/);
  assert.match(style.fontVariationSettings, /"wght" 500/);
  assert.match(style.fontVariationSettings, /"GRAD" 25/);
  assert.match(style.fontVariationSettings, /"opsz" 32/);
  await page.locator('#weight').fill('700');
  await page.locator('#grade').fill('200');
  await page.locator('#optical-size').fill('48');
  const maxAxes = await font.evaluate(
    node => getComputedStyle(node).fontVariationSettings,
  );
  assert.match(maxAxes, /"wght" 700/);
  assert.match(maxAxes, /"GRAD" 200/);
  assert.match(maxAxes, /"opsz" 48/);
  await page.locator('#weight').fill('100');
  await page.locator('#grade').fill('-50');
  await page.locator('#optical-size').fill('20');
  const minAxes = await font.evaluate(
    node => getComputedStyle(node).fontVariationSettings,
  );
  assert.match(minAxes, /"wght" 100/);
  assert.match(minAxes, /"GRAD" -50/);
  assert.match(minAxes, /"opsz" 20/);
  await page.locator('#scheme').selectOption('dark');
  assert.equal(
    await page.locator('body').getAttribute('data-md-scheme'),
    'dark',
  );
  assert.equal(
    await svg.evaluate(node => getComputedStyle(node).color),
    'rgb(230, 224, 233)',
  );
  const darkContrast = await svg.evaluate(node => [
    getComputedStyle(node).color,
    getComputedStyle(node.closest('.card')).backgroundColor,
  ]);
  assert.ok(contrast(...darkContrast) >= 4.5);
  await page.locator('#direction').selectOption('rtl');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.setViewportSize({width: 390, height: 844});
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  assert.equal(
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
      scrollTo(999, 0);
      const offset = scrollX;
      document.documentElement.style.zoom = '';
      scrollTo(0, 0);
      return offset;
    }),
    0,
    'Native gallery scrolls horizontally at 200% zoom',
  );
  await page.getByRole('button', {name: 'Confirm'}).focus();
  await page.keyboard.press('Enter');
  assert.equal(
    await page
      .getByRole('button', {name: 'Confirm'})
      .getAttribute('data-pressed'),
    'true',
  );
  const fonts = await page.locator('html').getAttribute('data-font-available');
  if (fonts === 'true') {
    for (const name of ['Outlined', 'Rounded', 'Sharp']) {
      const loaded = await page.evaluate(async family => {
        await document.fonts.load(`24px "Material Symbols ${family}"`, 'check');
        return document.fonts.check(
          `24px "Material Symbols ${family}"`,
          'check',
        );
      }, name);
      assert.equal(loaded, true, `${name} font failed to load`);
    }
  } else {
    assert.equal(await page.getByRole('status').count(), 1);
  }
  assert.deepEqual(errors, []);
  console.log(
    `Chrome ${browser.version()}: native Icon and MaterialSymbol browser checks passed (${fonts === 'true' ? 'pinned fonts' : 'font-free build'}).`,
  );
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
