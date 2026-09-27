// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material shadow geometry: Copyright Google LLC, Apache-2.0.

/** @input Pinned Web shadow-layer source, built native Elevation, and Material token CSS. @output Exact Chrome source/native shadow pixels across six levels and themes. @position Permanent native Elevation visual regression. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';
import {chromium} from 'playwright';
import {Elevation} from '../dist/Elevation/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(await fs.readFile(
  path.join(root, '../themes/material3/src/material3ElevationSource.json'),
  'utf8',
));
const css = [
  await fs.readFile(path.join(root, 'dist/tokens.css'), 'utf8'),
  await fs.readFile(path.join(root, 'dist/components.css'), 'utf8'),
].join('\n');
assert.equal(source.sourceCommit, 'cbd34a8921915af94d5ef65c2a69eece41d5b4f3');
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  executablePath: process.env.M3_BROWSER_EXECUTABLE,
});
try {
  for (const [scheme, override] of [
    ['light', ''],
    ['dark', ''],
    ['expressive-light', ''],
    ['light', '--md-sys-color-shadow:#2549aa'],
  ]) {
    const cases = Array.from({length: 6}, (_, level) => {
      const geometry = source.layers[`level${level}`];
      const shadow = part => geometry[part].boxShadow.replace(
        source.sampleColor,
        'var(--md-sys-color-shadow)',
      );
      const reference = `<span aria-hidden="true" class="reference"><span class="source-key" style="box-shadow:${shadow('key')};opacity:${geometry.key.opacity}"></span><span class="source-ambient" style="box-shadow:${shadow('ambient')};opacity:${geometry.ambient.opacity}"></span></span>`;
      const native = renderToStaticMarkup(createElement(Elevation, {
        level,
        'data-testid': `native-${level}`,
      }));
      return `<div class="case" id="source-${level}"><div class="owner">${reference}</div></div><div class="case" id="actual-${level}"><div class="owner">${native}</div></div>`;
    }).join('');
    const page = await browser.newPage({
      viewport: {width: 500, height: 980},
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
      *{box-sizing:border-box}html,body{margin:0}
      body{display:grid;grid-template-columns:216px 216px;gap:12px;padding:12px;background:var(--md-sys-color-surface-container-lowest)}
      .case{width:216px;height:142px;padding:32px;background:var(--md-sys-color-surface-container-lowest);${override}}
      .owner{position:relative;width:152px;height:78px;border-radius:16px;background:var(--md-sys-color-surface)}
      .reference,.source-key,.source-ambient{position:absolute;inset:0;display:block;border-radius:inherit;pointer-events:none}
    </style></head><body data-md-scheme="${scheme}">${cases}</body></html>`);
    const boundary = await page.locator('#actual-3 .owner > span').evaluate(node => {
      const owner = node.parentElement;
      const paint = getComputedStyle(node);
      const key = getComputedStyle(node.children[0]);
      const ambient = getComputedStyle(node.children[1]);
      const hit = document.elementFromPoint(
        owner.getBoundingClientRect().left + 20,
        owner.getBoundingClientRect().top + 20,
      );
      return {
        role: node.getAttribute('role'),
        hidden: node.getAttribute('aria-hidden'),
        tabIndex: node.getAttribute('tabindex'),
        pointer: paint.pointerEvents,
        radius: paint.borderRadius,
        zIndex: paint.zIndex,
        transition: paint.transitionDuration,
        animation: paint.animationName,
        hitOwner: hit === owner,
        keyShadow: key.boxShadow,
        ambientShadow: ambient.boxShadow,
      };
    });
    assert.equal(boundary.role, null);
    assert.equal(boundary.hidden, 'true');
    assert.equal(boundary.tabIndex, '-1');
    assert.equal(boundary.pointer, 'none');
    assert.equal(boundary.radius, '16px');
    assert.equal(boundary.zIndex, 'auto');
    assert.equal(boundary.transition, '0s');
    assert.equal(boundary.animation, 'none');
    assert.equal(boundary.hitOwner, true);
    assert.ok(boundary.keyShadow.includes(override ? 'rgb(37, 73, 170)' : 'rgb(0, 0, 0)'));
    assert.ok(boundary.ambientShadow.includes(override ? 'rgb(37, 73, 170)' : 'rgb(0, 0, 0)'));
    for (let level = 0; level < 6; level++) {
      const expected = PNG.sync.read(await page.locator(`#source-${level}`).screenshot());
      const actual = PNG.sync.read(await page.locator(`#actual-${level}`).screenshot());
      const changed = pixelmatch(
        expected.data,
        actual.data,
        null,
        expected.width,
        expected.height,
        {threshold: 0, includeAA: true},
      );
      assert.equal(changed, 0, `${scheme} level ${level} ${override || 'default'} pixels`);
    }
    if (scheme === 'light' && !override) {
      const alignment = await page.locator('#actual-3 .owner > span').evaluate(node => {
        document.documentElement.dir = 'rtl';
        document.body.style.zoom = '125%';
        const owner = node.parentElement.getBoundingClientRect();
        const root = node.getBoundingClientRect();
        return {
          x: root.x - owner.x,
          y: root.y - owner.y,
          width: root.width - owner.width,
          height: root.height - owner.height,
        };
      });
      assert.deepEqual(alignment, {x: 0, y: 0, width: 0, height: 0});
      await page.emulateMedia({forcedColors: 'active'});
      const forced = await page.locator('#actual-3 .owner > span').evaluate(node => ({
        role: node.getAttribute('role'),
        hidden: node.getAttribute('aria-hidden'),
        pointer: getComputedStyle(node).pointerEvents,
        shadow: getComputedStyle(node.children[0]).boxShadow,
      }));
      assert.equal(forced.role, null);
      assert.equal(forced.hidden, 'true');
      assert.equal(forced.pointer, 'none');
      assert.equal(forced.shadow, 'none');
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('Native Elevation matches pinned independent shadow layers: 24 exact crops.');
