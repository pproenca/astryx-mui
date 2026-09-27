// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-divider-browser.mjs
 * @input Built native Divider paint and Material token CSS
 * @output Chrome semantics, token override, forced-colors, RTL and narrow-layout checks
 * @position Permanent native Divider browser regression
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';
import {HorizontalDivider, VerticalDivider} from '../dist/Divider/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = [
  await fs.readFile(path.join(root, 'dist/tokens.css'), 'utf8'),
  await fs.readFile(path.join(root, 'dist/components.css'), 'utf8'),
].join('\n');
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
async function preview(props, options = {}) {
  const page = await browser.newPage({
    viewport: {width: 320, height: 240},
    forcedColors: options.forcedColors || 'none',
  });
  const html = `<!doctype html><html dir="${options.direction || 'ltr'}"><head><meta charset="utf-8"><style>${css}\n*{box-sizing:border-box}html,body{margin:0}main{width:${options.width || 240}px;height:160px;margin:20px;${options.tokens || ''}}</style></head><body data-md-scheme="${options.scheme || 'light'}"><main>${renderToStaticMarkup(createElement(props.orientation === 'vertical' ? VerticalDivider : HorizontalDivider, {'data-testid': 'rule', ...props}))}</main></body></html>`;
  await page.setContent(html);
  return page;
}
try {
  let page = await preview({orientation: 'horizontal'});
  let rule = page.getByTestId('rule');
  assert.equal(await rule.getAttribute('role'), null);
  assert.equal(await rule.getAttribute('aria-hidden'), 'true');
  assert.equal(await rule.getAttribute('tabindex'), null);
  assert.equal(
    await rule.evaluate(node => getComputedStyle(node).backgroundColor),
    'rgb(202, 196, 208)',
  );
  assert.equal((await rule.boundingBox()).height, 1);
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    'BODY',
  );
  await page.close();

  page = await preview(
    {orientation: 'horizontal', inset: 'start'},
    {width: 64, direction: 'rtl', scheme: 'expressive-light'},
  );
  rule = page.getByTestId('rule');
  await page.evaluate(() => {
    document.body.style.zoom = '200%';
  });
  assert.equal((await rule.boundingBox()).width, 96);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    'Zoomed RTL Divider overflows the viewport',
  );
  await page.close();

  page = await browser.newPage({viewport: {width: 320, height: 240}});
  await page.setContent(
    `<!doctype html><html><head><style>${css}\n*{box-sizing:border-box}html,body{margin:0}.scroll{margin:16px;width:180px;height:60px;overflow:auto}.nested{width:280px;padding:8px;background:var(--md-sys-color-surface-container-low)}</style></head><body data-md-scheme="light"><div class="scroll"><div class="nested">${renderToStaticMarkup(createElement(HorizontalDivider, {'data-testid': 'nested-rule'}))}</div></div></body></html>`,
  );
  const nested = page.getByTestId('nested-rule');
  assert.equal((await nested.boundingBox()).width, 264);
  assert.equal(
    await nested.evaluate(node => getComputedStyle(node).pointerEvents),
    'none',
  );
  assert.ok(
    await page.evaluate(
      () => document.querySelector('.scroll').scrollWidth > 180,
    ),
  );
  await page.close();

  page = await preview(
    {orientation: 'vertical', role: 'separator'},
    {
      scheme: 'dark',
      tokens: '--md-divider-color:#123456;--md-divider-thickness:3px',
    },
  );
  rule = page.getByRole('separator');
  assert.equal(await rule.getAttribute('aria-orientation'), 'vertical');
  assert.equal(await rule.getAttribute('aria-hidden'), null);
  assert.deepEqual(await rule.boundingBox(), {
    x: 20,
    y: 20,
    width: 3,
    height: 160,
  });
  assert.equal(
    await rule.evaluate(node => getComputedStyle(node).backgroundColor),
    'rgb(18, 52, 86)',
  );
  await page.close();

  page = await preview(
    {orientation: 'horizontal', thickness: 20, color: '#ff00ff', inset: 'both'},
    {width: 64, direction: 'rtl'},
  );
  rule = page.getByTestId('rule');
  assert.deepEqual(await rule.boundingBox(), {
    x: 252,
    y: 20,
    width: 32,
    height: 20,
  });
  assert.equal(
    await rule.evaluate(node => getComputedStyle(node).backgroundColor),
    'rgb(255, 0, 255)',
  );
  await page.close();

  page = await preview({orientation: 'horizontal'}, {forcedColors: 'active'});
  rule = page.getByTestId('rule');
  const forced = await rule.evaluate(node => {
    const reference = document.createElement('span');
    reference.style.color = 'CanvasText';
    document.body.append(reference);
    return {
      rule: getComputedStyle(node).backgroundColor,
      canvasText: getComputedStyle(reference).color,
      transition: getComputedStyle(node).transitionDuration,
      animation: getComputedStyle(node).animationName,
    };
  });
  assert.equal(forced.rule, forced.canvasText);
  assert.equal(forced.transition, '0s');
  assert.equal(forced.animation, 'none');
  await page.close();

  page = await preview(
    {orientation: 'horizontal', thickness: 'hairline'},
    {forcedColors: 'active'},
  );
  rule = page.getByTestId('rule');
  assert.equal((await rule.boundingBox()).height, 0);
  assert.equal(
    await rule.evaluate(
      node => getComputedStyle(node, '::after').backgroundColor,
    ),
    forced.canvasText,
  );
  await page.close();
} finally {
  await browser.close();
}
process.stdout.write(
  'Native Divider semantics, tokens, forced colors, RTL and narrow layout passed.\n',
);
