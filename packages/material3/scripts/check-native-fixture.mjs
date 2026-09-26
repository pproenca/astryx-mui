// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-native-fixture.mjs
 * @input Built native token entry point and standalone override fixture
 * @output Chrome evidence that scoped Material roles reach native CSS without Core aliases
 * @position Native package boundary browser regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {material3Var} from '../dist/index.js';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const html = await fs.readFile(
  path.join(packageRoot, 'fixtures/native-token.html'),
  'utf8',
);
assert.equal(
  material3Var('--md-sys-color-primary'),
  'var(--md-sys-color-primary)',
);
assert.equal(
  material3Var('--md-sys-shape-corner-medium'),
  'var(--md-sys-shape-corner-medium)',
);
assert.ok(!html.includes('--color-') && !html.includes('--astryx-'));

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent(html);
  const sample = page.locator('#sample');
  const appearance = () =>
    sample.evaluate(node => {
      const computed = getComputedStyle(node);
      return {
        color: computed.color,
        background: computed.backgroundColor,
        radius: computed.borderRadius,
      };
    });
  assert.deepEqual(await appearance(), {
    color: 'rgb(255, 255, 255)',
    background: 'rgb(81, 47, 120)',
    radius: '12px',
  });
  await page.locator('#toggle').click();
  assert.deepEqual(await appearance(), {
    color: 'rgb(255, 255, 255)',
    background: 'rgb(15, 101, 139)',
    radius: '28px',
  });
  await page.locator('#toggle').click();
  assert.equal((await appearance()).background, 'rgb(81, 47, 120)');
  await page.setViewportSize({width: 320, height: 640});
  await page.locator('body').evaluate(node => {
    node.dir = 'rtl';
  });
  await page.locator('#toggle').focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(await appearance(), {
    color: 'rgb(255, 255, 255)',
    background: 'rgb(15, 101, 139)',
    radius: '28px',
  });
  assert.equal(await page.locator('#toggle').getAttribute('type'), 'button');
} finally {
  await browser.close();
}
process.stdout.write('Native Material token boundary fixture passed.\n');
