// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-preview-browser.mjs
 * @input Exact-revision foundation preview and pinned color schemes
 * @output Chrome checks for contrast, mode, RTL, responsive, focus, and motion
 * @position Automated gate before human Material 3 foundation QA
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const html = fs.readFileSync(path.join(root, 'dist/preview.html'), 'utf8');
const colors = JSON.parse(
  fs.readFileSync(path.join(root, 'src/material3ColorSource.json'), 'utf8'),
);
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
});
if (revision.status !== 0) throw new Error('Cannot identify Astryx revision.');
const sha = revision.stdout.trim();
const luminance = value => {
  const digits = value.slice(1);
  const full =
    digits.length === 3
      ? [...digits].map(char => char + char).join('')
      : digits;
  return [0, 2, 4]
    .map(index => Number.parseInt(full.slice(index, index + 2), 16) / 255)
    .map(channel =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
      0,
    );
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const cssRgb = hex =>
  `rgb(${[1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
const pairs = [
  ['primary', 'on-primary'],
  ['primary-container', 'on-primary-container'],
  ['secondary', 'on-secondary'],
  ['secondary-container', 'on-secondary-container'],
  ['tertiary', 'on-tertiary'],
  ['tertiary-container', 'on-tertiary-container'],
  ['error', 'on-error'],
  ['error-container', 'on-error-container'],
  ['surface', 'on-surface'],
  ['surface-container', 'on-surface'],
  ['background', 'on-background'],
  ['inverse-surface', 'inverse-on-surface'],
];
for (const mode of ['light', 'dark']) {
  for (const [background, foreground] of pairs) {
    const ratio = contrast(
      colors[`${mode}Resolved`][background],
      colors[`${mode}Resolved`][foreground],
    );
    assert.ok(
      ratio >= 4.5,
      `${mode} ${foreground} on ${background}: ${ratio.toFixed(2)}:1`,
    );
  }
}
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1280, height: 800}});
  await page.setContent(html);
  assert.equal(await page.locator('body').getAttribute('data-revision'), sha);
  for (const [selector, count] of [
    ['.swatch', 49],
    ['.type-sample', 15],
    ['.shape-sample', 7],
    ['.elevation-card', 6],
    ['.icon-sample', 28],
  ]) {
    assert.equal(await page.locator(selector).count(), count, selector);
  }
  await page.keyboard.press('Tab');
  const focus = await page.locator('#mode').evaluate(node => ({
    active: document.activeElement === node,
    outline: getComputedStyle(node).outlineWidth,
  }));
  assert.ok(
    focus.active && focus.outline === '3px',
    'Keyboard focus must be visible.',
  );
  const background = await page
    .locator('.theme')
    .evaluate(node => getComputedStyle(node).backgroundColor);
  assert.equal(background, cssRgb(colors.lightResolved.background));
  await page.locator('#contrast').click();
  assert.equal(
    await page.locator('#contrast').getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page
      .locator('.swatch')
      .first()
      .evaluate(node => getComputedStyle(node).outlineWidth),
    '2px',
  );
  await page.locator('#contrast').click();
  assert.equal(
    await page.locator('#contrast').getAttribute('aria-pressed'),
    'false',
  );
  await page.locator('#motion').click();
  assert.equal(
    await page.locator('#motion').getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await page
      .locator('.motion-dot')
      .evaluate(node => getComputedStyle(node).transitionDuration),
    '0s',
  );
  await page.locator('#motion').click();
  assert.equal(
    await page.locator('#motion').getAttribute('aria-pressed'),
    'false',
  );
  await page.locator('#animate').click();
  assert.ok(
    await page
      .locator('.motion-dot')
      .evaluate(node => node.classList.contains('moved')),
  );
  await page.locator('#mode').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  const dark = await page
    .locator('.theme')
    .evaluate(node => getComputedStyle(node).backgroundColor);
  assert.equal(dark, cssRgb(colors.darkResolved.background));
  await page.locator('#direction').click();
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  const positions = await page
    .locator('.swatch')
    .evaluateAll(nodes =>
      nodes.slice(0, 2).map(node => node.getBoundingClientRect().x),
    );
  assert.ok(
    positions[0] > positions[1],
    'RTL grid order must follow writing direction.',
  );
  await page.setViewportSize({width: 375, height: 812});
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    'Narrow preview must not scroll horizontally.',
  );
  await page.emulateMedia({reducedMotion: 'reduce'});
  assert.equal(
    await page
      .locator('.motion-dot')
      .evaluate(node => getComputedStyle(node).transitionDuration),
    '0s',
  );
  await page.emulateMedia({forcedColors: 'active'});
  assert.equal(
    await page
      .locator('.swatch')
      .first()
      .evaluate(node => getComputedStyle(node).borderTopWidth),
    '2px',
  );
  console.log(
    `Chrome ${browser.version()}: 24 contrast pairs, 105 preview samples, light/dark, control states, keyboard, RTL, 375px, reduced motion, and forced colors passed at ${sha.slice(0, 12)}.`,
  );
} finally {
  await browser.close();
}
